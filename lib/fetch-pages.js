"use strict";

// TODO add noFile option

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
    "fileContents": ''
  };

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

        console.log('Number of items: '+count);
        console.log('Number of pages: '+pagesCount);

        getItems(params, pageNumber, pagesCount, callback, callbackParams);
      }
    });
}

function getItems(params, pageNumber, pagesCount, callback, callbackParams) {
  var timer = 400;
  var path = '/admin/'+params.what+'.json';
  var fileData = '';
  var fileName;
  var uri = '';
  var what = params.what;

  fileName = 'data_'+params.side+'_'+params.what;
  fileName = fileName.replace(/\W/gi, '_').toLowerCase();

  if ( what.indexOf('/') >= 0 ) {
    what = what.replace(/(\w+)\//gi, '');
  }

  if ( pageNumber <= pagesCount ) {
    console.log('Page number for '+params.what+': '+pageNumber);

    uri = params.baseURL+path+'?limit='+params.requestLimit;
    if ( pagesCount > 1 ) {
      uri += '&page='+pageNumber;
    }

    if ( pageNumber === 1 ) {
      fs.writeFileSync(fileName+'.json', '{'+'"'+what+'":[', { 'encoding': 'utf8' });
    }

    request(
      { method: 'GET',
        uri: uri },
      function(error, response, body) {
        var result; 
        var i;

        if (!error && response.statusCode === 200) {
          result = JSON.parse(body);
          result = result[what];

          params.fileContents = '';
          for ( i = 0; i < result.length; i += 1 ) {
            if ( pageNumber === pagesCount ) {
              params.fileContents += JSON.stringify(result[i]);
            } else {
              params.fileContents += JSON.stringify(result[i])+',';
            }
          }

          fs.appendFile(fileName+'.json', params.fileContents, { 'encoding': 'utf8' }, function(err) {
            if (err) throw err;
            console.log('Data appended');
            pageNumber += 1;
            setTimeout( getItems, timer, params, pageNumber, pagesCount, callback, callbackParams);
          });
        } else {
          console.log('ERROR '+response.statusCode);
        }
      });
  } else {
    if (callback !== undefined ) {
      callback(callbackParams);
    }
  }
}

