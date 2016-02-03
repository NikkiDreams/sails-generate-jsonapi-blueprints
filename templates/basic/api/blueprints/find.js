/**
 * Module dependencies
 */
var util = require( 'util' ),
  actionUtil = require( './_util/actionUtil' );

/**
 * Enable sideloading. Edit config/blueprints.js and add:
 *   jsonapi: {
 *     sideload: true
 *   }
 * Defaults to false.
 *
 * @type {Boolean}
 */
var performSideload = (sails.config.blueprints.jsonapi && sails.config.blueprints.jsonapi.sideload);

/**
 * Find Records
 *
 *  get   /:modelIdentity
 *   *    /:modelIdentity/find
 *
 * An API call to find and return model instances from the data adapter
 * using the specified criteria.  If an id was specified, just the instance
 * with that unique id will be returned.
 *
 * Optional:
 * @param {Object} where       - the find criteria (passed directly to the ORM)
 * @param {Integer} limit      - the maximum number of records to send back (useful for pagination)
 * @param {Integer} skip       - the number of records to skip (useful for pagination)
 * @param {String} sort        - the order of returned records, e.g. `name ASC` or `age DESC`
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */

module.exports = function findRecords( req, res ) {

  // Look up the model
  var Model = actionUtil.parseModel( req );

  // Lookup for records that match the specified criteria
  var query = Model.find()
    .where( actionUtil.parseCriteria( req ) )
    .limit( actionUtil.parseLimit( req ) )
    .skip( actionUtil.parseSkip( req ) )
    .sort( actionUtil.parseSort( req ) );

  query = actionUtil.populateEach( query, req );
  query.exec( function found( err, matchingRecords ) {
    if ( err ) return res.serverError( err );

    // Only `.watch()` for new instances of the model if
    // `autoWatch` is enabled.
    if ( req._sails.hooks.pubsub && req.isSocket ) {
      Model.subscribe( req, matchingRecords );
      if ( req.options.autoWatch ) {
        Model.watch( req );
      }
      // Also subscribe to instances of all associated models
      _.each( matchingRecords, function ( record ) {
        actionUtil.subscribeDeep( req, record );
      } );
    }

    res.ok( actionUtil.makeApiJSON( Model, matchingRecords, req.options.associations, performSideload ) );
  } );
};
