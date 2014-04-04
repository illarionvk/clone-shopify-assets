"use strict";

// TODO Clean up objectType
// TODO Implement a test run

var fs = require('fs');
var request = require('request');

module.exports = function(objectArray, objectType, callback, callbackParams) {
  createRequests(objectArray, objectType, callback, callbackParams);
};

function createRequests(objectArray, objectType, callback, callbackParams) {
  var i = 0;
  var requests = [];
  var requestBody;
  var item = {};

  var path = '';
  var requestIterator = 0;
  var errorCount = 0;
  var params = {};

  path = '/admin/'+objectType+'s.json';

  objectType = objectType.toLowerCase();

  if (objectType.indexOf('/') >= 0) {
    objectType = objectType.replace(/(\w+)\//g, '');
  }

  for (i = 0; i < objectArray.length; i += 1) {
    item = objectArray[i];

    requestBody = {};
    requestBody[objectType] = item;

    requests.push(requestBody);
  }

  //console.log(requests);

  params.requests = requests;
  params.objectType = objectType;
  params.path = path;
  params.callback = callback;
  params.callbackParams = callbackParams;

  sendRequests(requestIterator, errorCount, params);

}

function sendRequests(requestIterator, errorCount, params) {
  var requests = params.requests;
  var objectType = params.objectType;

  var config = JSON.parse( fs.readFileSync('./config2.json', { 'encoding': 'utf8' }) );
  var baseURL = 'https://'+config.destination.apiKey+':'+config.destination.password+'@'+config.destination.shop;
  var path = params.path;
  var data;

  var info = '';
  var stdin = process.stdin, stdout = process.stdout;

  var callback = params.callback;
  var callbackParams = params.callbackParams;

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
        setTimeout( sendRequests, 750, requestIterator, errorCount, params );
      });

  } else {
    if (errorCount > 0) {
      console.error('There were '+errorCount+' errors. Errors were logged.');

      if (callback !== undefined && callbackParams !== undefined ) {
        stdin.resume();
        stdout.write("Continue? (y/n): ");

        stdin.once('data', function(answer) {
          answer = answer.toString().toLowerCase().trim();
          if ( answer === 'y' || answer === 'yes' ) {
            callback(callbackParams);
          }
        });
      } else {
        console.info('Done');
      }
    } else {
      if (callback !== undefined && callbackParams !== undefined ) {
        callback(callbackParams);
      } else {
        console.info('Done');
      }
    }
  }
}
