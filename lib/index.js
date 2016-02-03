/**
 * sails-generate-jsonapi
 *
 * Usage:
 * `sails generate jsonapi-blueprints`
 *
 * @type {Object}
 */

var fs = require('fs');
var templateDir = require( 'path' ).resolve( __dirname, '../templates' );

module.exports = {

  templatesDirectory: templateDir,

  before: require( './before' ),

  targets: {
    './': {
      exec: function ( scope, cb ) {
        // get the "flavor" of bluepritns
        templateDir = templateDir + '/' + scope.flavor;
        console.log( 'Running generator (sails-generate-jsonapi-blueprints) @ `' + scope.rootPath + '`...' );

        // check for previous installation
        if ( fs.existsSync( scope.rootPath + '/api/blueprints' ) && fs.existsSync( scope.rootPath + '/api/services/JSONApi.js' ) && !scope.force ) {
          console.log( scope );
          return cb( new Error( 'Looks like the blueprints are already installed. Just in case you made some changes to them, we\'re stopping here. If you want to override the existing files and do a fresh install use the \'--force\' option.' ) );
        }

        // copy blueprint and service files
        console.log( 'Installing "' + scope.flavor + '" of blueprints.' );

        // create blueprints directory if it does not exist
        if ( !fs.existsSync( scope.rootPath + '/api/blueprints' ) ) {
          fs.mkdirSync( scope.rootPath + '/api/blueprints' );
        }

        ['create', 'destroy', 'find', 'findone', 'populate', 'update'].forEach(function (blueprint) {
          fs.writeFileSync(scope.rootPath + '/api/blueprints/' + blueprint + '.js', 'module.exports = require(\'sails-generate-jsonapi-blueprints/templates/' + scope.flavor + '/api/blueprints/' + blueprint + '.js\');\n');
        });

        fs.writeFileSync(scope.rootPath + '/api/services/JSONApi.js', 'module.exports = require(\'sails-generate-jsonapi-blueprints/templates/' + scope.flavor + '/api/services/JSONApi.js\');\n');

        cb();
      }
    }
  }
};
