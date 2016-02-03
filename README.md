Sails-Generate-JSON API-Blueprints
======================

[![NPM version](https://badge.fury.io/js/sails-generate-jsonapi-blueprints.svg)](http://badge.fury.io/js/sails-generate-jsonapi-blueprints) ![Build status](https://travis-ci.org/mphasize/sails-generate-jsonapi-blueprints.svg?branch=master)

JSON API Data compatible blueprints for Sails v0.11+
This project is inspired by several projects:
* [sails-generate-ember-blueprints](https://www.npmjs.com/package/sails-generate-ember-blueprints)
* [sails-hook-jsonapi](https://www.npmjs.com/package/sails-hook-jsonapi)
* [generator-sails-rest-api](https://www.npmjs.com/package/generator-sails-rest-api)

I started this project because the Ember community badly needs JSONApi support in Sails. I am one of those Ember devs in bad need of this. So I am doing it myself. But this is really for the greater Sails community. I want to thank sails-generate-ember-blueprints. For without that project this one would not have been started. Much of the code is migrate from that project to get this project started. I gotta give credit where credit is due. Additional ideas are fostered in the sails-hook-jsonapi project which seems to have gone dormant. And lastly I hope have this project partner with the generator-sails-rest-api project. Eugene has created something pretty darn awesome. I do encourage anyone to contribute. Sails needs JSONAPI Format now.


[Sails](http://www.sailsjs.org/)  override default Sails blueprints to support jsonapi.org compatible blueprints.

The blueprints provide JSON API formatted data.
Ember support is provided by using the JSONAPIAdapter in Ember.

# API

The generators support different flavors for your API.

**basic**: Basic blueprints should get you up and running in no time and serve as a good basis to start development. They come with a default configuration that sideloads all records found in the model's associations.

**advanced**: If you need more powerful control over your API, you may consider upgrading to the "advanced" blueprints. These blueprints allow fine-grained control over how API responses handle sideloading a model's associations.

**json-api**: Unfortunately not yet available, but it would also be great to support 100% [json api](http://jsonapi.org/) compatible responses.

# Getting started


* Install the generator into your (new) Sails project `npm install sails-generate-jsonapi-blueprints`
* Run the generator: `sails generate jsonapi-blueprints`
* Configure sails to use **pluralized** blueprint routes.

	In `myproject/config/blueprints.js` set `pluralize: true`

      module.exports.blueprints = {
        // ...
        pluralize: true
      };


* Generate some API resources, e.g. `sails generate api user`
* Start your app with `sails lift`

Now you should be up and running and your JSON API Data app should be able to talk to your Sails backend.

### Advanced Blueprints

The "basic" blueprints make a basic Sails app work with JSON API Data, but in a more complex project you may need more fine-grained control over how the Sails Rest API handles associations/relations and what is included in the API responses. Enter the "advanced" blueprints.

* Run the generator with: `sails generate jsonapi-blueprints advanced --force` to update to the advanced blueprints.
* Add a configuration option `associations: { list: "link", detail: "record" }`
 to `myproject/config/models.js`. This will determine the default behaviour.

      module.exports.models = {
        // ...
        associations: {
        	list: "link",
        	detail: "record"
        }
      };

* Add a configuration option `validations: { ignoreProperties: [ 'includeIn' ] }`
to `myproject/config/models.js`. This tells Sails to ignore our individual configuration on a model's attributes.

      module.exports.models = {
        // ...
        validations: {
        	ignoreProperties: ['includeIn']
        }
      };

* Setup individual presentation on a model attribute by adding `includeIn: { list: "option", detail: "option"}` where option is one of `link`, `index`, `record`.

      attributes: {
        name : "string",
        posts: {
          collection: "post",
          via: "user",
          includeIn: {
            list: "record",
            detail: "record"
          }
        }
      }


**Presentation options:**  
The `link` setting will generate jsonapi.org URL style `links` properties on the records, which JSON API Data can consume and load lazily.

The `index` setting will generate an array of ID references for JSON API Data, so be loaded as necessary.

The `record` setting will sideload the complete record.


### Troubleshooting

If the generator exits with
`error: Something else already exists at ... ` you can try running it with the `--force` option (at your own risk!)

Some records from relations/associations are missing? Sails has a default limit of 30 records per relation when populating. Try increasing the limit as a work-around until a pagination solution exists.

### JSONAPIAdapter

If you're using [Ember CLI](//ember-cli.com), you need to use the DS.JSONAPIAdapter adapter. This is now the default adapter in Ember 2.x+ Please see [Ember Guides for using Adapters](https://guides.emberjs.com/v2.3.0/models/customizing-adapters/)



### Sideloading records in EmberJS

To enable this behavior, add the following lines to the `config/blueprints.js` file:

```
// config/blueprints.js
module.exports.blueprints = {
  // existing configuration
  // ...

  jsonapi: {
    sideload: true
  }
}
```

#JSONAPI Format
```jsonapi
{
  "data": {
    "type": "articles",
    "id": "1",
    "attributes": {
      // ... this article's attributes
    },
    "relationships": {
      // ... this article's relationships
    }
  }
}
```


# Todo

### Many Since I just started.
