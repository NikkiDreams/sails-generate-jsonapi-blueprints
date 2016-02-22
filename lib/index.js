"use strict";
/**
 * sails-generate-jsonapi
 *
 * Usage:
 * `sails generate jsonapi-blueprints`
 *
 * @type {Object}
 */

var fs = require('fs');
var rmdir = require( 'rmdir' );
var templateDir = require( 'path' ).resolve( __dirname, '../templates' );

module.exports = {

  templatesDirectory: templateDir,

  before: require( './before' ),

  targets: {
    './': {
      exec: function ( scope, cb, err ) {
        const inRootBP = scope.rootPath + '/api/blueprints';
        const inRootSrvc = scope.rootPath + '/api/services/jsonapiService.js';
        const inRootResponse = scope.rootPath + '/api/responses/jsonapi_ok.js';

        // get the "flavor" of bluepritns
        console.log("SCOPE",scope.flavor);

        function testFor(it, cb){
          fs.stat(it, function(err, stats) {
            let detected = false;
            if ( scope.flavor !== "remove" ) {
                return;
            }
            else{
              if (stats && stats.isFile()) {
                  console.log('_______ file', it);
                  detected = true;
              }
              else if (stats && stats.isDirectory()) {
                  console.log('_______ directory', it);
                  detected = true;
              }
              return cb();
            }
          });
        }

        if ( scope.flavor === "remove" ) {
          console.warn( 'WARNING: JSONAPI Blueprints will be deleted.');
          console.log( 'Removing (sails-generate-jsonapi-blueprints) blueprint files @ `' + scope.flavor + '`...' );
          rmdir( inRootBP, function ( err, dirs, files ){
            console.log( "___directory", dirs );
            console.log( "___files", files );
            console.log( 'all files are removed' );
          });

          testFor( inRootSrvc, () => {
            console.log( 'Removing (sails-generate-jsonapi-blueprints) JSONAPI service file @ `' + scope.flavor + '`...' );
            fs.unlink(inRootSrvc, function(err) {
               if (err) {
                 return;
                  //return console.error(err);
               }
               console.log("File deleted successfully!");
            });
          });

          testFor( inRootResponse, () => {
            console.log( 'Removing (sails-generate-jsonapi-blueprints) OK response file @ `' + scope.flavor + '`...' );
            fs.unlink(inRootResponse, function(err) {
               if (err) {
                 return;
                 return console.error(err);
               }
               console.log("File deleted successfully!");
            });
          });

        }
        else{
          fs.stat(templateDir + '/' + scope.flavor, function(err, stats) {
            if (err) {
                return cb(console.error( 'No JSONAPI Blueprints found for "' + scope.flavor + '"'));
                return;
            }

            console.log( 'Running generator (sails-generate-jsonapi-blueprints) @ `' + scope.rootPath + '`...' );

            // check for previous installation
            testFor( inRootBP, () => {
              return cb( new Error( 'Looks like the blueprints are already installed. Just in case you made some changes to them, we\'re stopping here. If you want to override the existing files and do a fresh install use the \'--force\' option.' ) );
            });

            // copy blueprint and service files
            console.log( 'Installing "' + scope.flavor + '" of blueprints.' );

            // create blueprints directory if it does not exist
            fs.mkdirSync( scope.rootPath + '/api/blueprints' );

            ['add', 'create', 'destroy', 'find', 'findone', 'message', 'messageone', 'populate', 'remove', 'update'].forEach(function (blueprint) {
                fs.writeFileSync(inRootBP + '/' + blueprint + '.js', 'var _ = require("lodash");\nvar _super = require(\'sails-generate-jsonapi-blueprints/templates/' + scope.flavor + '/api/blueprints/' + blueprint + '.js\');\n_.merge(exports, _super);\n\n_.merge(exports, {\n  /* Extend or override core functions */\n}');
            });

            fs.writeFileSync(inRootResponse, 'var _ = require("lodash");\nvar _super = require(\'sails-generate-jsonapi-blueprints/templates/' + scope.flavor + '/api/responses/jsonapi_ok.js\');\n_.merge(exports, _super);\n\n_.merge(exports, {\n  /* Extend or override core functions */\n}');

            fs.writeFileSync(inRootSrvc, 'var _ = require("lodash");\nvar _super = require(\'sails-generate-jsonapi-blueprints/templates/' + scope.flavor + '/api/services/jsonapiService.js\');\n_.merge(exports, _super);\n\n_.merge(exports, {\n  /* Extend or override core functions */\n}');

            cb();
          });
        }
      }
    }
  }
};
