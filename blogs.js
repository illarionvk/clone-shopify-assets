(function() {
"use strict";

var fs = require('fs');
var request = require('request');

var fp = require('./lib/fetch-pages.js');
var sendItems = require('./lib/send-items.js');

function getBlogCount() {
  var config = JSON.parse( fs.readFileSync('./config2.json', { 'encoding': 'utf8' }) );
  var baseURL = 'https://'+config.source.apiKey+':'+config.source.password+'@'+config.source.shop;
  var path = '/admin/blogs/count.json';

  request(
    { method: 'GET',
      uri: baseURL+path },
    function(error, response, body) {
      var count;

      if (!error && response.statusCode === 200) {
        count = parseInt(JSON.parse(body).count, 10);
        console.log('Number of blogs: '+count);

        getBlogs(); 

      } else {
        console.log('Error '+response.statusCode);
      }
    });
}

function getBlogs() {
  var config = JSON.parse( fs.readFileSync('./config2.json', { 'encoding': 'utf8' }) );
  var baseURL = 'https://'+config.source.apiKey+':'+config.source.password+'@'+config.source.shop;
  var path = '/admin/blogs.json';

  request(
    { method: 'GET',
      uri: baseURL+path },
    function(error, response, body) {
      var blogs = [];
      var blog = [];
      var i = 0;

      if (!error && response.statusCode === 200) {
        blogs = JSON.parse(body).blogs;
        console.log('Blogs are fetched');

        for (i = 0; i < blogs.length; i += 1) {
          blog = blogs[i];
          copyBlog(blog);
        }

      } else {
        console.log('Error '+response.statusCode);
      }
    });
}

function copyBlog(blog) {
  var objectArray = [];

  objectArray.push(blog);
  console.log(objectArray);

  //sendItems(objectArray, 'blog', copyArticles, blog);
  copyArticles(blog);
}

function copyArticles(sourceBlog) {
  fp('source', 'blogs/'+sourceBlog.id+'/articles', function() {
    //fp('destination', 'blogs', function() {
      //console.log(sourceBlog.id);
    //}, sourceBlog);
  });
}

getBlogCount();

//fp('source', 'pages', copyPages);

})();
