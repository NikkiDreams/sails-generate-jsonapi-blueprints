(function() {
  var actionUtil;

  actionUtil = require('./helpers/actionUtil');

  module.exports = function(req, res) {
    var Model, pk, query;
    Model = actionUtil.parseModel(req);
    pk = actionUtil.requirePk(req);
    query = Model.findOne(pk);
    query = actionUtil.populateEach(query, req);
    return query.exec(function(err, record) {
      if (err) {
        return res.serverError(err);
      }
      if (!record) {
        return res.notFound("No record found with the specified `id`: " + pk);
      }
      if (req._sails.hooks.pubsub && req.isSocket) {
        Model.subscribe(req, record);
        actionUtil.subscribeDeep(req, record);
      }
      record = actionUtil.populateNull(record, req);
      return res.ok(record);
    });
  };

}).call(this);
