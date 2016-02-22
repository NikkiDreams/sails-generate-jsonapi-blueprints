'use strict';

/**
 * 200 (OK) Response
 *
 * Usage:
 * return res.ok();
 * return res.ok(data);
 *
 * @param  {Object} data
 */

module.exports = function sendOK(data) {
  const _ = require('lodash');
  const JSONAPISerializer = require('jsonapi-serializer');
  const modelUtils = require('../utils/model-utils');
  const normUtils = require('../utils/norm-utils');
  const pluralize = require('pluralize');
  var Model,
      modelName,
      pluralModel,
      opts,
      relatedModelNames,
      jsonApiRes;

  // Get access to `req`, `res`, & `sails`
  var req = this.req;
  var res = this.res;
  var sails = req._sails;

  const config = sails.config.blueprints;



  sails.log.silly('res.ok() :: Sending 200 ("OK") response');

  // Find model and begin constructing options
  modelName = modelUtils.getModelName(req);
  sails.log.silly('[jsonapi] modelName ::', modelName);
  Model = sails.models[modelName];
  opts = {
    attributes: modelUtils.getAttributes(Model),
    keyForAttribute: function (attribute) {
      return _.camelCase(attribute);
    }
  };
  // Add related model data
  relatedModelNames = modelUtils.getRelatedModelNames(req);
  relatedModelNames.forEach(function (m) {
    //sails.log.silly("Model__Which____",m);
    Model = _.get(sails.models, m);
    //sails.log.silly("Model__Z____",m,Model);
    // Related model attributes
    opts[m] = {
      attributes: modelUtils.getOwnAttributes(Model)
    };
    // Compound Document options
    if (sails.config.jsonapi.compoundDoc) {
      modelUtils.getRef(Model, function (ref) {
        opts[m].ref = ref;
      });
      opts[m].included = sails.config.jsonapi.included;
    }
  });

  // Clean up data (removes 'add' and 'remove' functions)
  data = normUtils.normalizeData(data);

  sails.log.silly("JSONAPISerializer:Options", opts);
  // Serialize to jsonapi
  jsonApiRes = new JSONAPISerializer(modelName, data, opts);
  sails.log.verbose("JSONAPISerializer:Response",jsonApiRes);

  // Set status code and send response
  res.status(200);
  return res.json(jsonApiRes);
};
