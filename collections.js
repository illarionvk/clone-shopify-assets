(function() {
"use strict";

var request = require('request');
var fs = require('fs');

function getStuff() {
  var config = JSON.parse( fs.readFileSync('./config.json', { 'encoding': 'utf8' }) );
  var sourceBaseURL;
  var requestLimit = 250;

  sourceBaseURL = 'https://'+config.sourceApiKey+':'+config.sourcePassword+'@'+config.sourceShop;

  request(
    { method: 'GET',
      uri: sourceBaseURL+'/admin/custom_collections.json'+'?limit='+requestLimit },
    parseResult);
}

function parseResult(error, response, body) {
  var result = JSON.parse(body);
  var prop;

  if (!error && response.statusCode == 200) {
    // console.log(result);
    for (prop in result) {
      if (result.hasOwnProperty(prop) && typeof(prop) !== 'function') {
        console.log('Number of items: '+result[prop].length);
        break;
      }
    }

    createCollection(result);
  }
}

function createCollection(result) {
  var config = JSON.parse( fs.readFileSync('./config.json', { 'encoding': 'utf8' }) );
  var destBaseURL = 'https://'+config.destApiKey+':'+config.destPassword+'@'+config.destShop;
  var path = '/admin/custom_collections.json'; 

  var i = 0;
  var array = result.custom_collections;

  function uploadToShopify(i, destBaseURL, path, array) {
    var data = {};
    if (i < array.length) {
      data = { "custom_collection": array[i] };
      console.log(i+': Uploading '+data.custom_collection.handle);
      request(
        { method: 'POST',
          uri: destBaseURL+path,
          json: data },
        function(error, response, body) {
          if (!error && response.statusCode == 201) {
            console.log('Data Transmitted'+body);
          } else {
            console.error('Error: '+response.statusCode);
          }
          i += 1;
          setTimeout( uploadToShopify, 300, i, destBaseURL, path, array );
        });
    }
  }

  uploadToShopify(i, destBaseURL, path, array);
}


getStuff();

})();
