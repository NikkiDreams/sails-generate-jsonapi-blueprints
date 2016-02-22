(function() {
  var actionUtil, _;

  actionUtil = require('./helpers/actionUtil');

  _ = require('lodash');

  module.exports = function(req, res) {
    var Model, query;
    if (actionUtil.parsePk(req)) {
      return require('./findOne')(req, res);
    }
    Model = actionUtil.parseModel(req);
    query = Model.find().where(actionUtil.parseCriteria(req)).limit(actionUtil.parseLimit(req)).skip(actionUtil.parseSkip(req)).sort(actionUtil.parseSort(req));
    query = actionUtil.populateEach(query, req);
    return query.exec(function(err, records) {
      var record, watch, _i, _len;
      if (err) {
        return res.serverError(err);
      }
      if (req._sails.hooks.pubsub && req.isSocket) {
        Model.subscribe(req, records);
        for (_i = 0, _len = records.length; _i < _len; _i++) {
          record = records[_i];
          actionUtil.subscribeDeep(req, record);
        }
      }
      watch = req.query.watch || req.options.autowatch || req.options.autoWatch;
      if (watch === 'false' || !watch) {
        Model.unwatch(req);
      } else if (watch) {
        Model.watch(req);
      }
      records = actionUtil.populateNull(records, req);
      return res.ok(records);
    });
  };

}).call(this);
