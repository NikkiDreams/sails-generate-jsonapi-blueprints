'use strict';

exports.normalizeData = function (data,id) {
  //console.log("JSONAPI_NORM-UTILS",id,data);
  var resp = JSON.stringify(data);

  if(typeof resp === 'undefined'){
    resp = {
      data: {},
      id: {}
    };
  }
  //console.log("JSONAPI_NORM-UTILS:DATA",typeof data, resp);

  return JSON.parse(resp);
};
