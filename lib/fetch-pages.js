"use strict";

var fs = require('fs');
var request = require('request');

module.exports = function(side, what, callback, callbackParams) {
  fetchAllPages(side, what, callback, callbackParams);
};

function fetchAllPages(side, what, callback, callbackParams) {
  var requestLimit = 250;
  var config = JSON.parse( fs.readFileSync('./config2.json', { 'encoding': 'utf8' }) );
  var baseURL = 'https://'+config[side].apiKey+':'+config[side].password+'@'+config[side].shop;
  var path = '/admin/'+what+'/count.json';

  var params = {
    "side": side,
    "what": what,
    "baseURL": baseURL,
    "requestLimit": requestLimit,
    "fileContents": {}
  };

  params.fileContents[params.what] = [];

  console.log('Direction: '+side);
  console.log('What: '+what);
  console.log('Fetching from '+config[side].shop);

  request(
    { method: 'GET',
      uri: baseURL+path },
    function(error, response, body) {
      var count;
      var pagesCount; 
      var pagesCountModulo;
      var pageNumber = 1;

      if (!error && response.statusCode === 200) {
        count = parseInt(JSON.parse(body).count, 10);

        pagesCount = parseInt(count / requestLimit, 10);
        pagesCountModulo = count % requestLimit;
        if ( pagesCountModulo > 0 ) {
          pagesCount += 1;
        }

        console.log('Number of collects: '+count);
        console.log('Number of pages: '+pagesCount);

        getItems(params, pageNumber, pagesCount, callback, callbackParams);
      }
    });
}

function getItems(params, pageNumber, pagesCount, callback, callbackParams) {
  var timer = 400;
  var path = '/admin/'+params.what+'.json';
  var fileData;

  if ( pageNumber <= pagesCount ) {
    console.log('Page number for '+params.what+': '+pageNumber);

    request(
      { method: 'GET',
        uri: params.baseURL+path+'?limit='+params.requestLimit+'&page='+pageNumber },
      function(error, response, body) {
        var result; 
        var what = params.what;
        var i;
        
        if (!error && response.statusCode === 200) {
          result = JSON.parse(body);
          result = result[what];
          for ( i = 0; i < result.length; i += 1 ) {
            params.fileContents[what].push(result[i]);
          }

          pageNumber += 1;
          setTimeout( getItems, timer, params, pageNumber, pagesCount, callback, callbackParams);
        } else {
          console.log('ERROR '+response.statusCode);
        }
      });
  } else {
    fileData = JSON.stringify(params.fileContents);
    fs.writeFileSync(params.side+'_'+params.what+'.json', fileData, { 'encoding': 'utf8' });
    console.log('File written');
    if (callback !== undefined ) {
      callback(callbackParams);
    }
  }
}

