(function() {
"use strict";

var fs = require('fs');

var fp = require('./lib/fetch-pages.js');
var sendItems = require('./lib/send-items.js');

function copySmartCols() {
  var collections = {};
  var collection;
  var i = 0;

  collections = JSON.parse(
    fs.readFileSync(
      './data_source_smart_collections.json',
      { encoding: 'utf8' }) ).smart_collections;

  for (i = 0; i < collections.length; i += 1) {
    collection = collections[i];

    delete collection.id;
  }

  sendItems(collections, 'smart_collection');
}

fp('source', 'smart_collections', copySmartCols);

})();
