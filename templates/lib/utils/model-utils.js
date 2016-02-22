'use strict';

let pluralize = require('pluralize');

// Only attributes which are not primary key ('id') or have an alias (relationship)
exports.getOwnAttributes = function (Model) {
  let ownAttrs = [];
  Object.keys(Model.definition).forEach(function (key) {
    if (!Model.definition[key].primaryKey && !Model.definition[key].alias) {
      ownAttrs.push(key);
    }
  });
  return ownAttrs;
};

// Attributes for compound document style
exports.getRef = function (Model, cb) {
  Object.keys(Model.definition).forEach(function (key) {
    if (Model.definition[key].primaryKey) {
      return cb(key);
    }
  });
};

// Only strips primary key ('id')
exports.getAttributes = function (Model) {
  let attrs = [];
  Object.keys(Model._attributes).forEach(function (key) {
    if (!Model._attributes[key].primaryKey) {
      attrs.push(key);
    }
  });
  return attrs;
};

// Returns model name from request
exports.getModelName = function (req) {
  //sails.log.silly("getModelName____",req.options);
  return req.options.model;
};

// Returns singular-ized model names of related models
exports.getRelatedModelNames = function (req) {
  let rels = [];
  req.options.associations.forEach(function (assoc) {
    let ass = assoc.alias;
    /* Properly get associated collections and models */
    if(assoc.alias && assoc.type === "collection"){
      ass = assoc.collection;
    }
    else if(assoc.alias && assoc.type === "model"){
      ass = assoc.model;
    }
    rels.push(ass);
  });
  return rels;
};
