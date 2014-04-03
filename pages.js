(function() {
"use strict";

var fs = require('fs');
var request = require('request');

var fp = require('./lib/fetch-pages.js');

function copyPages() {
  var source = {};
  var page;
  var i = 0;

  source.pages = JSON.parse(
    fs.readFileSync(
      './source_pages.json',
      { encoding: 'utf8' }) ).pages;

  console.log('Total source pages: '+source.pages.length);

  for (i = 0; i < source.pages.length; i += 1) {
    page = source.pages[i];

    delete page.id;
    delete page.shop_id;

    //console.log(page);
  }

  createRequests(source.pages, 'page');
}

function createRequests(objectArray, objectType) {
  var i = 0;
  var requests = [];
  var requestBody;
  var item = {};

  var requestIterator = 0;
  var errorCount = 0;

  for (i = 0; i < objectArray.length; i += 1) {
    item = objectArray[i];

    requestBody = {};
    requestBody[objectType] = item;

    requests.push(requestBody);
  }

  console.log(requests);

  sendRequests(requestIterator, requests, objectType, errorCount);

  if (errorCount > 0) {
    console.error('There were '+errorCount+' errors. Errors were logged.');
  }
}

function sendRequests(requestIterator, requests, objectType, errorCount) {
  var config = JSON.parse( fs.readFileSync('./config2.json', { 'encoding': 'utf8' }) );
  var baseURL = 'https://'+config.destination.apiKey+':'+config.destination.password+'@'+config.destination.shop;
  var path = '/admin/'+objectType+'s.json';
  var data;
  var info = '';

  if (requestIterator < requests.length) {
    data = requests[requestIterator];

    info += requestIterator+' '+path+'\n'; 
    info += 'Sending to '+config.destination.shop+'\n';
    info += 'Sending contents of '+objectType+': '+data[objectType].handle+'\n';
    console.log(info);

    request(
      { method: 'POST',
        uri: baseURL+path,
        json: data },
      function(error, response, body) {
        if (!error && response.statusCode == 201) {
          console.log('Data Transmitted'+body);
        } else {
          console.error('Error: '+response.statusCode);
          info += 'Error: '+response.statusCode+'\n';
          info += JSON.stringify(response)+'\n';
          errorCount += 1;
          fs.appendFileSync('./errors.log', info, { 'encoding': 'utf8' });
        }

        requestIterator += 1;
        setTimeout( sendRequests, 500, requestIterator, requests, objectType, errorCount );
      });

  } else {
    console.log('End');
  }
}

fp('source', 'pages', copyPages);

})();
