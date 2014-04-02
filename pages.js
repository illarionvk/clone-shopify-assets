(function() {
"use strict";

var fs = require('fs');
var request = require('request');

var fp = require('./lib/fetch-pages.js');

function copyPages() {
  var source = {};
  var i;

  source.pages = JSON.parse(
    fs.readFileSync(
      './source_pages.json',
      { encoding: 'utf8' }) ).pages;

  console.log('Total source pages: '+source.collects.length);

  for (i = 0; i < source.pages.length; i += 1) {

  }

  //createRequests(resolved);
}

fp('source', 'pages', copyPages);

})();


