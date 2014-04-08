"use strict";

var fs = require('fs');
var fp = require('./lib/fetch-pages.js');


fp('source', 'products', function() {
  console.log('DONE!!!');
});
