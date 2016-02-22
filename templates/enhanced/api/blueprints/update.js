(function() {
  var Promise, actionUtil, _;

  actionUtil = require('./helpers/actionUtil');

  _ = require('lodash');

  Promise = require("bluebird");

  module.exports = function(req, res) {
    var Model, data, parsedData, pk, promises;
    Model = actionUtil.parseModel(req);
    pk = actionUtil.requirePk(req);
    data = actionUtil.parseValues(req);
    if (data[Model.primaryKey] != null) {
      delete data[Model.primaryKey];
    }
    parsedData = actionUtil.parseData(data, Model);
    promises = {};
    _.forOwn(parsedData.associated, function(relation, alias) {
      if (relation.create.length) {
        return promises[alias] = new Promise(function(resolve, reject) {
          return relation.Model.create(relation.create).exec(function(err, associatedRecordsCreated) {
            var associatedRecord, ids, _i, _j, _len, _len1;
            if (err) {
              reject(err);
            }
            if (!associatedRecordsCreated) {
              sails.log.warn('No associated records were created for some reason...');
            }
            if (req._sails.hooks.pubsub) {
              if (req.isSocket) {
                for (_i = 0, _len = associatedRecordsCreated.length; _i < _len; _i++) {
                  associatedRecord = associatedRecordsCreated[_i];
                  relation.Model.introduce(associatedRecord);
                }
              }
              for (_j = 0, _len1 = associatedRecordsCreated.length; _j < _len1; _j++) {
                associatedRecord = associatedRecordsCreated[_j];
                relation.Model.publishCreate(associatedRecord, !req.options.mirror && req);
              }
            }
            ids = _.pluck(associatedRecordsCreated, relation.Model.primaryKey);
            return resolve(ids);
          });
        });
      }
    });
    promises._record = new Promise(function(resolve, reject) {
      var alias, association, query, _ref;
      query = Model.findOne(pk);
      _ref = req.options.associations;
      for (alias in _ref) {
        association = _ref[alias];
        if (parsedData.associated[association.alias] || association.type === 'model') {
          query = query.populate(association.alias);
        }
      }
      return query.exec(function(err, matchingRecord) {
        if (err) {
          return reject(err);
        }
        return resolve(matchingRecord);
      });
    });
    return Promise.props(promises).error(function(err) {
      return res.negotiate(err);
    }).then(function(asyncData) {
      var alias, id, ids, intersection, key, matchingRecord, mirrorAlias, previousRecord, raw, relation, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      matchingRecord = asyncData._record;
      previousRecord = matchingRecord;
      delete asyncData._record;
      if (!matchingRecord) {
        return res.notFound("Could not find record with the `id`: " + pk);
      }
      for (alias in asyncData) {
        ids = asyncData[alias];
        parsedData.associated[alias].add = _.uniq(parsedData.associated[alias].add.concat(ids));
      }
      _ref = parsedData.associated;
      for (alias in _ref) {
        relation = _ref[alias];
        mirrorAlias = actionUtil.mirror(Model, alias);
        if (relation.association.type === 'collection') {
          if (matchingRecord[alias]) {
            relation.remove = _.pluck(matchingRecord[alias], relation.Model.primaryKey);
            intersection = _.intersection(relation.remove, relation.add);
            relation.remove = _.difference(relation.remove, intersection);
            relation.add = _.difference(relation.add, intersection);
            _ref1 = relation.remove;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              id = _ref1[_i];
              matchingRecord[alias].remove(id);
            }
            if (mirrorAlias) {
              _ref2 = relation.remove;
              for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                id = _ref2[_j];
                matchingRecord[mirrorAlias].remove(id);
              }
            }
          }
          _ref3 = relation.add;
          for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
            id = _ref3[_k];
            matchingRecord[alias].add(id);
          }
          if (mirrorAlias) {
            _ref4 = relation.add;
            for (_l = 0, _len3 = _ref4.length; _l < _len3; _l++) {
              id = _ref4[_l];
              matchingRecord[mirrorAlias].add(id);
            }
          }
        } else if (relation.association.type === 'model' && relation.add.length) {
          matchingRecord[alias] = relation.add[0];
        }
      }
      _ref5 = parsedData.raw;
      for (key in _ref5) {
        raw = _ref5[key];
        matchingRecord[key] = raw;
      }
      return matchingRecord.save(function(err) {
        var addedId, populate, query, removedId, _len4, _len5, _len6, _len7, _m, _n, _o, _p, _ref10, _ref6, _ref7, _ref8, _ref9;
        if (err) {
          return res.negotiate(err);
        }
        if (req._sails.hooks.pubsub) {
          if (req.isSocket) {
            Model.subscribe(req, matchingRecord);
          }
          Model.publishUpdate(matchingRecord[Model.primaryKey], _.cloneDeep(data), !req.options.mirror && req, {
            previous: previousRecord
          });
          _ref6 = parsedData.associated;
          for (alias in _ref6) {
            relation = _ref6[alias];
            mirrorAlias = actionUtil.mirror(Model, alias);
            if (relation.association.type === 'collection') {
              if (relation.remove) {
                _ref7 = relation.remove;
                for (_m = 0, _len4 = _ref7.length; _m < _len4; _m++) {
                  removedId = _ref7[_m];
                  Model.publishRemove(matchingRecord[Model.primaryKey], relation.association.alias, removedId, !req.options.mirror && req);
                }
                if (mirrorAlias) {
                  _ref8 = relation.remove;
                  for (_n = 0, _len5 = _ref8.length; _n < _len5; _n++) {
                    removedId = _ref8[_n];
                    Model.publishRemove(matchingRecord[Model.primaryKey], mirrorAlias, removedId, !req.options.mirror && req);
                  }
                }
              }
              _ref9 = relation.add;
              for (_o = 0, _len6 = _ref9.length; _o < _len6; _o++) {
                addedId = _ref9[_o];
                Model.publishAdd(matchingRecord[Model.primaryKey], relation.association.alias, addedId, !req.options.mirror && req);
              }
              if (mirrorAlias) {
                _ref10 = relation.add;
                for (_p = 0, _len7 = _ref10.length; _p < _len7; _p++) {
                  addedId = _ref10[_p];
                  Model.publishAdd(matchingRecord[Model.primaryKey], mirrorAlias, addedId, !req.options.mirror && req);
                }
              }
            }
          }
        }
        populate = actionUtil.parsePopulate(req);
        if (!populate || _.size(populate) === 0) {
          return res.ok(matchingRecord);
        }
        query = Model.findOne(matchingRecord[Model.primaryKey]);
        query = actionUtil.populateEach(query, req);
        return query.exec(function(err, populatedRecord) {
          if (err) {
            return res.serverError(err);
          }
          if (!populatedRecord) {
            return res.notFound('Could not find record after updating...');
          }
          if (req._sails.hooks.pubsub) {
            if (req.isSocket) {
              actionUtil.subscribeDeep(req, populatedRecord);
            }
          }
          populatedRecord = actionUtil.populateNull(populatedRecord, req);
          return res.ok(populatedRecord);
        });
      });
    });
  };

}).call(this);
