(function() {
  var actionUtil, _;

  actionUtil = require('./helpers/actionUtil');

  _ = require('lodash');

  module.exports = function(req, res) {
    var Model, childPk, parentPk, relation;
    Model = actionUtil.parseModel(req);
    relation = req.options.alias;
    if (!relation) {
      return res.serverError(new Error('Missing required route option, `req.options.alias`.'));
    }
    parentPk = req.param('parentid');
    childPk = actionUtil.parsePk(req);
    return Model.findOne(parentPk).exec(function(err, parentRecord) {
      var mirrorAlias;
      if (err) {
        return res.serverError(err);
      }
      if (!parentRecord || !parentRecord[relation]) {
        return res.notFound();
      }
      parentRecord[relation].remove(childPk);
      if ((mirrorAlias = actionUtil.mirror(Model, relation))) {
        parentRecord[mirrorAlias].remove(childPk);
      }
      return parentRecord.save(function(err) {
        var populate, query;
        if (err) {
          return res.negotiate(err);
        }
        if (req._sails.hooks.pubsub) {
          Model.publishRemove(parentRecord[Model.primaryKey], relation, childPk, !sails.config.blueprints.mirror && req);
          if ((mirrorAlias = actionUtil.mirror(Model, relation))) {
            Model.publishRemove(parentRecord[Model.primaryKey], mirrorAlias, childPk, !sails.config.blueprints.mirror && req);
          }
        }
        if (req._sails.hooks.pubsub && req.isSocket) {
          Model.subscribe(req, parentRecord);
        }
        populate = actionUtil.parsePopulate(req);
        if (!populate || _.size(populate) === 0) {
          return res.ok(parentRecord);
        }
        query = Model.findOne(parentPk);
        query = actionUtil.populateEach(query, req);
        return query.exec(function(err, parentRecord) {
          if (err) {
            return res.serverError(err);
          }
          if (!parentRecord) {
            return res.serverError();
          }
          if (req._sails.hooks.pubsub && req.isSocket) {
            actionUtil.subscribeDeep(req, parentRecord);
          }
          parentRecord = actionUtil.populateNull(parentRecord, req);
          return res.ok(parentRecord);
        });
      });
    });
  };

}).call(this);
