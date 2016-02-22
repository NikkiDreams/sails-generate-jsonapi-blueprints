(function() {
  var JSONP_CALLBACK_PARAM, defaultHeaderPrefix, getHeader, tryToParseJSON, _;

  _ = require('lodash');

  JSONP_CALLBACK_PARAM = 'callback';

  module.exports = {
    populateEach: function(query, req) {
      var DEFAULT_POPULATE_LIMIT, alias, aliasFilter, association, criteria, options, populate, _ref;
      DEFAULT_POPULATE_LIMIT = sails.config.blueprints.defaultLimit || 30;
      options = req.options;
      populate = options.parsed_populate || (options.parsed_populate = module.exports.parsePopulate(req));
      if ((populate === true) || ((populate == null) && options.populate)) {
        _ref = options.associations;
        for (alias in _ref) {
          association = _ref[alias];
          query = query.populate(association.alias, {
            limit: DEFAULT_POPULATE_LIMIT
          });
        }
      } else if (_.isObject(populate)) {
        aliasFilter = _.pluck(options.associations, 'alias');
        for (alias in populate) {
          criteria = populate[alias];
          if (_.contains(aliasFilter, alias)) {
            query = _.isObject(criteria) ? query.populate(alias, criteria) : query.populate(alias);
          }
        }
      }
      return query;
    },
    populateNull: function(records, req) {
      var alias, aliasFilter, association, criteria, options, populate, record, result, _i, _j, _len, _len1, _ref;
      if (!_.isArray(records)) {
        records = [records];
        result = records[0];
      } else {
        result = records;
      }
      options = req.options;
      populate = options.parsed_populate || (options.parsed_populate = module.exports.parsePopulate(req));
      if ((populate === true) || ((populate == null) && options.populate)) {
        _ref = options.associations;
        for (alias in _ref) {
          association = _ref[alias];
          for (_i = 0, _len = records.length; _i < _len; _i++) {
            record = records[_i];
            if (record[alias] == null) {
              record[alias] = null;
            }
          }
        }
      } else if (_.isObject(populate)) {
        aliasFilter = _.pluck(options.associations, 'alias');
        for (alias in populate) {
          criteria = populate[alias];
          for (_j = 0, _len1 = records.length; _j < _len1; _j++) {
            record = records[_j];
            if (_.contains(aliasFilter, alias) && (record[alias] == null)) {
              record[alias] = null;
            }
          }
        }
      }
      return result;
    },
    populateAll: function(query, req) {
      var alias, association, associations;
      associations = req.options.associations;
      for (alias in associations) {
        association = associations[alias];
        query = query.populate(association.alias);
      }
      return query;
    },
    flattenAssociations: function(records, Model) {
      var association, i, nested, nestedModel, record, result, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
      if (!_.isArray(records)) {
        records = [records];
        result = records[0];
      } else {
        result = records;
      }
      _ref = Model.associations;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        association = _ref[_i];
        nestedModel = sails.models[association[association.type]];
        for (_j = 0, _len1 = records.length; _j < _len1; _j++) {
          record = records[_j];
          if (_.isArray(record[association.alias])) {
            _ref1 = record[association.alias];
            for (i = _k = 0, _len2 = _ref1.length; _k < _len2; i = ++_k) {
              nested = _ref1[i];
              if (nested[nestedModel.primaryKey] != null) {
                record[association.alias][i] = nested[nestedModel.primaryKey];
              } else {
                record[association.alias][i] = null;
              }
            }
          } else if (_.isObject(record[association.alias])) {
            if (record[association.alias][nestedModel.primaryKey] != null) {
              record[association.alias] = nested[nestedModel.primaryKey];
            } else {
              record[association.alias] = null;
            }
          }
        }
      }
      return result;
    },
    subscribeDeep: function(req, record) {
      return _.each(req.options.associations, function(assoc) {
        var AssociatedModel, ident, _i, _len, _ref, _ref1, _results;
        ident = assoc[assoc.type];
        AssociatedModel = sails.models[ident];
        if (assoc.type === 'collection' && record[assoc.alias]) {
          _ref = record[assoc.alias];
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            record = _ref[_i];
            if (record[AssociatedModel.primaryKey] != null) {
              _results.push(AssociatedModel.subscribe(req, record));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        } else if (assoc.type === 'model' && (((_ref1 = record[assoc.alias]) != null ? _ref1[AssociatedModel.primaryKey] : void 0) != null)) {
          return AssociatedModel.subscribe(req, record[assoc.alias]);
        }
      });
    },
    parsePk: function(req) {
      var pk;
      pk = req.options.id || req.param('id');
      return pk = _.isPlainObject(pk) ? void 0 : pk;
    },
    requirePk: function(req) {
      var err, pk;
      pk = module.exports.parsePk(req);
      if (!pk) {
        err = new Error('No `id` parameter provided. (Note: even if the models primary key is not named `id` - `id` should be used as the name of the parameter - it will be mapped to the proper primary key name)');
        err.status = 400;
        throw err;
      }
      return pk;
    },
    parseCriteria: function(req) {
      var where;
      where = req.query.where || getHeader(req, 'where');
      if (_.isString(where)) {
        where = tryToParseJSON(where);
      }
      return _.merge({}, req.options.where, where);
    },
    parseValues: function(req) {
      var values;
      values = req.body;
      values = _.omit(values, function(v) {
        return _.isUndefined(v);
      });
      return values;
    },
    parseData: function(data, Model) {
      var AssociatedModel, alias, aliasData, aliases, association, parseRecord, record, result, _i, _len;
      aliases = _.pluck(Model.associations, 'alias');
      result = {
        raw: {},
        associated: {}
      };
      parseRecord = function(aliasData, AssociatedModel) {
        if (_.isObject(aliasData) && (aliasData[AssociatedModel.primaryKey] == null)) {
          aliasData = module.exports.flattenAssociations(aliasData, AssociatedModel);
          return result.associated[alias].create.push(aliasData);
        } else {
          return result.associated[alias].add.push(aliasData[AssociatedModel.primaryKey] || aliasData);
        }
      };
      for (alias in data) {
        aliasData = data[alias];
        if ((aliasData != null) && _.contains(aliases, alias)) {
          result.associated[alias] = {
            create: [],
            add: []
          };
          association = result.associated[alias].association = _.findWhere(Model.associations, {
            alias: alias
          });
          AssociatedModel = result.associated[alias].Model = sails.models[association[association.type]];
          if (_.isArray(aliasData)) {
            if (association.type === 'collection') {
              for (_i = 0, _len = aliasData.length; _i < _len; _i++) {
                record = aliasData[_i];
                parseRecord(record, AssociatedModel);
              }
            }
          } else if (association.type === 'model') {
            parseRecord(aliasData, AssociatedModel);
          } else {
            sails.log.warn("Could not parse attribute " + alias + ":" + aliasData + ".Type collection expects an array.");
          }
        } else {
          result.raw[alias] = aliasData;
        }
      }
      return result;
    },
    parseModel: function(req) {
      var Model, model;
      model = req.options.model || req.options.controller;
      if (!model) {
        throw new Error('No "model" specified in route options.');
      }
      Model = req._sails.models[model];
      if (!Model) {
        throw new Error("Invalid route option, `model`.\n I don't know about any models named: " + model);
      }
      return Model;
    },
    parseSort: function(req) {
      var query, sort;
      query = req.query.sort;
      if (_.isString(query)) {
        sort = tryToParseJSON(query);
      }
      if (!sort) {
        sort = query;
      }
      return sort;
    },
    parsePopulate: function(req) {
      var key, keys, populate, query, _i, _len;
      query = req.query.populate;
      if (query == null) {
        return query;
      }
      if (_.isString(query)) {
        populate = tryToParseJSON(query);
        if (_.isArray(populate)) {
          keys = populate;
        } else if (populate == null) {
          keys = query.split(',');
        }
        if (keys) {
          populate = {};
          for (_i = 0, _len = keys.length; _i < _len; _i++) {
            key = keys[_i];
            populate[key] = null;
          }
        }
      }
      if (populate == null) {
        populate = query;
      }
      return populate;
    },
    parseLimit: function(req) {
      var DEFAULT_LIMIT, limit;
      DEFAULT_LIMIT = sails.config.blueprints.defaultLimit || 30;
      limit = req.query.limit || DEFAULT_LIMIT;
      if (limit) {
        limit = +limit;
      }
      return limit;
    },
    parseSkip: function(req) {
      var DEFAULT_SKIP, skip;
      DEFAULT_SKIP = 0;
      skip = req.query.skip || DEFAULT_SKIP;
      if (skip) {
        skip = +skip;
      }
      return skip;
    },
    mirror: function(Model, alias) {
      var mirrorAlias, _ref, _ref1;
      if (((_ref = Model._attributes[alias]) != null ? _ref.via : void 0) === (mirrorAlias = '_' + alias) && ((_ref1 = Model._attributes[mirrorAlias]) != null ? _ref1.via : void 0) === alias) {
        return mirrorAlias;
      } else {
        return false;
      }
    }
  };

  tryToParseJSON = function(json) {
    var e;
    if (!_.isString(json)) {
      return null;
    }
    try {
      return JSON.parse(json);
    } catch (_error) {
      e = _error;
      return null;
    }
  };

  defaultHeaderPrefix = 'sails-';

  getHeader = function(req, key, prefix) {
    var header, _ref;
    if (prefix != null) {
      key = prefix + key;
    }
    header = (typeof req.header === "function" ? req.header(key) : void 0) || ((((_ref = req.headers) != null ? _ref[key] : void 0) != null) && req.headers[key]) || (typeof req.get === "function" ? req.get(key) : void 0);
    if ((header == null) && (prefix == null)) {
      return getHeader(req, key, defaultHeaderPrefix);
    } else {
      return header;
    }
  };

}).call(this);
