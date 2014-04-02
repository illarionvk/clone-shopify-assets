(function() {
"use strict";

var fs = require('fs');
var request = require('request');

var fp = require('./lib/fetch-pages.js');

function resolveCollects() {
  var source = {};
  var destination = {};
  var resolved = {
    "collects": []
  };
  var i;

  source.collects = JSON.parse(
    fs.readFileSync(
      './source_collects.json',
      { encoding: 'utf8' }) ).collects;
  source.products = JSON.parse(
    fs.readFileSync(
      './source_products.json',
      { encoding: 'utf8' }) ).products;
  source.custom_collections = JSON.parse(
    fs.readFileSync(
      './source_custom_collections.json',
      { encoding: 'utf8' }) ).custom_collections;

  destination.products = JSON.parse(
    fs.readFileSync(
      './destination_products.json',
      { encoding: 'utf8' }) ).products;
  destination.custom_collections = JSON.parse(
    fs.readFileSync(
      './destination_custom_collections.json',
      { encoding: 'utf8' }) ).custom_collections;

  console.log('Total source collects: '+source.collects.length);

  for (i = 0; i < source.collects.length; i += 1) {
    findHandles(source.collects[i], source, resolved);
  }
  fs.writeFileSync('resolved.json', JSON.stringify(resolved), { 'encoding': 'utf8' });

  for (i = 0; i < resolved.collects.length; i += 1) {
    findDestIDs(resolved.collects[i], destination);
  }
  fs.writeFileSync('resolved.json', JSON.stringify(resolved), { 'encoding': 'utf8' });

  createRequests(resolved);
}

function findHandles(collect, source, resolved) {
  var i;
  var collection;
  var product;
  var collectionHandle;
  var productHandle;

  for (i = 0; i < source.custom_collections.length; i += 1) {
    collection = source.custom_collections[i];
    if ( collect.collection_id === collection.id ) {
      console.log('Found collection: '+collection.id+' '+collection.handle);
      collectionHandle = collection.handle;
    }
  }
  for (i = 0; i < source.products.length; i += 1) {
    product = source.products[i];
    if ( collect.product_id === product.id ) {
      console.log('Found product: '+product.id+' '+product.handle);
      productHandle = product.handle;
    }
  }
  if (collectionHandle !== undefined && productHandle !== undefined) {
    resolved.collects.push({
      "product_handle": productHandle,
      "collection_handle": collectionHandle
    });
  }
}

function findDestIDs(collect, destination) {
  var i;
  var collection;
  var product;
  var collectionID;
  var productID;

  for (i = 0; i < destination.custom_collections.length; i += 1) {
    collection = destination.custom_collections[i];
    if ( collect.collection_handle === collection.handle ) {
      console.log('Found destination collection: '+collection.id+' '+collection.handle);
      collectionID = collection.id;
    }
  }

  for (i = 0; i < destination.products.length; i += 1) {
    product = destination.products[i];
    if ( collect.product_handle === product.handle ) {
      console.log('Found destination product: '+product.id+' '+product.handle);
      productID = product.id;
    }
  }

  if (collectionID !== undefined && productID !== undefined) {
    collect.product_id = productID;
    collect.collection_id = collectionID;
  }
}

function createRequests(resolved) {
  var i;
  var collect;
  var requestBody;

  var requestIterator = 0;
  var requests = [];

  for (i = 0; i < resolved.collects.length; i += 1) {
    collect = resolved.collects[i];

    requestBody = {
      "collect": {
        "collection_id": collect.collection_id,
        "product_id": collect.product_id
      }
    }; 

    requests.push(requestBody);
  }
  //console.log(requests);
  sendRequests(requestIterator, requests);
}

function sendRequests(requestIterator, requests) {
  var config = JSON.parse( fs.readFileSync('./config2.json', { 'encoding': 'utf8' }) );
  var baseURL = 'https://'+config.destination.apiKey+':'+config.destination.password+'@'+config.destination.shop;
  var path = '/admin/collects.json';
  var data;

  if (requestIterator < requests.length) {
    data = requests[requestIterator];

    console.log('Sending request to '+config.destination.shop);
    console.log('Request contents: '+JSON.stringify(data));

    request(
      { method: 'POST',
        uri: baseURL+path,
        json: data },
      function(error, response, body) {
        if (!error && response.statusCode == 201) {
          console.log('Data Transmitted'+body);
        } else {
          console.error('Error: '+response.statusCode);
        }
        requestIterator += 1;
        console.log(requestIterator);
        setTimeout( sendRequests, 500, requestIterator, requests );
      });

  } else {
    console.log('End');
  }
}

fp('source', 'collects', function() {
  fp('source', 'products', function() {
    fp('source', 'custom_collections', function() {
      fp('destination', 'products', function() {
        fp('destination', 'custom_collections', resolveCollects);
      });
    });
  });
});

//resolveCollects();

})();

