(function() {
  var actionUtil;

  actionUtil = require('./helpers/actionUtil');

  module.exports = function(req, res) {
    var Model, pk;
    Model = actionUtil.parseModel(req);
    pk = actionUtil.requirePk(req);
    return Model.findOne(pk).populateAll().exec(function(err, record) {
      if (err) {
        return res.serverError(err);
      }
      if (!record) {
        return res.notFound("No record found with the specified `id`: " + pk);
      }
      return Model.destroy(pk).exec(function(err) {
        if (err) {
          return res.negotiate(err);
        }
        if (req._sails.hooks.pubsub) {
          Model.publishDestroy(pk, !req.options.mirror && req, {
            previous: record
          });
          if (req.isSocket) {
            Model.unsubscribe(req, record);
            Model.retire(record);
          }
        }
        record = actionUtil.populateNull(record, req);
        return res.ok(record);
      });
    });
  };

}).call(this);
