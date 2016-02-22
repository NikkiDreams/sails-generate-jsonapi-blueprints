(function() {
  var actionUtil, _;

  actionUtil = require('./helpers/actionUtil');

  _ = require('lodash');

  module.exports = function(req, res) {
    var Model, query;
    if (actionUtil.parsePk(req)) {
      return require('./messageone')(req, res);
    }
    Model = actionUtil.parseModel(req);
    query = Model.find().where(actionUtil.parseCriteria(req)).limit(actionUtil.parseLimit(req)).skip(actionUtil.parseSkip(req)).sort(actionUtil.parseSort(req));
    return query.exec(function(err, records) {
      var record, _i, _len;
      if (err) {
        return res.serverError(err);
      }
      if (req._sails.hooks.pubsub) {
        for (_i = 0, _len = records.length; _i < _len; _i++) {
          record = records[_i];
          Model.message(record, req.body);
        }
      }
      return res.ok();
    });
  };

}).call(this);
