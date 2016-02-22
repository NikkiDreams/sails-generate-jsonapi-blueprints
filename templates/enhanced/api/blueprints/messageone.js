(function() {
  var actionUtil;

  actionUtil = require('./helpers/actionUtil');

  module.exports = function(req, res) {
    var Model, pk, query;
    Model = actionUtil.parseModel(req);
    pk = actionUtil.requirePk(req);
    query = Model.findOne(pk);
    return query.exec(function(err, record) {
      if (err) {
        return res.serverError(err);
      }
      if (!record) {
        return res.notFound('No record found with the specified `id`.');
      }
      if (req._sails.hooks.pubsub) {
        Model.message(record, req.body);
      }
      return res.ok();
    });
  };

}).call(this);
