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

      if (!error && response.statusCode === 200) {
        blogs = JSON.parse(body).blogs;
        console.log('Blogs are fetched');

        copyBlogs(blogs);

      } else {
        console.log('Error '+response.statusCode);
      }
    });
}

function copyBlogs(sourceBlogs) {
  var stdin = process.stdin, stdout = process.stdout;
  var blog;
  var objectArray = [];
  var i = 0;

  for (i = 0; i < sourceBlogs.length; i += 1) {
    blog = sourceBlogs[i];
    objectArray.push(blog);
  }

  stdin.resume();
  stdout.write("Do destination blogs exist? (y/n): ");

  stdin.once('data', function(answer) {
    answer = answer.toString().toLowerCase().trim();
    if ( answer === 'y' || answer === 'yes' ) {
      fp('destination', 'blogs', function() {
        copyArticles(sourceBlogs);
      });
    } else if ( answer === 'n' || answer === 'no' ) {
      sendItems(objectArray, 'blog', function() {
        fp('destination', 'blogs', copyArticles, sourceBlogs);
      });
    } else {
      console.log('Unknown answer, start the program again');
    }
  });
}

function copyArticles(sourceBlogsArray) {
  var sourceBlog;
  var i = 0;

  for (i = 0; i < sourceBlogsArray.length; i += 1) {
    sourceBlog = sourceBlogsArray[i];
    fp('source', 'blogs/'+sourceBlog.id+'/articles', resolveBlogIDs, sourceBlog);
  }
}

function resolveBlogIDs(sourceBlog) {
  var destination = JSON.parse( fs.readFileSync('./data_destination_blogs.json', { 'encoding': 'utf8' }) );
  var destBlog;
  var destBlogID;
  var i = 0;

  for (i = 0; i < destination.blogs.length; i += 1) {
    destBlog = destination.blogs[i];
    if ( destBlog.handle === sourceBlog.handle ) {
      destBlogID = destBlog.id;
      console.log('\nBlog handle: '+destBlog.handle);
      console.log('Source blog ID: '+sourceBlog.id);
      console.log('Destination blog ID: '+destBlogID);
    }
  }

  sendArticles(sourceBlog, destBlogID);
}

function sendArticles(sourceBlog, destBlogID) {
  var source = {};
  var article;
  var i = 0;

  source.articles = JSON.parse(
    fs.readFileSync(
      './data_source_blogs_'+sourceBlog.id+'_articles.json',
      { encoding: 'utf8' }) ).articles;

  console.log('Total source articles: '+source.articles.length);

  for (i = 0; i < source.articles.length; i += 1) {
    article = source.articles[i];

    delete article.id;
    delete article.user_id;
    delete article.blog_id;

  }

  sendItems(source.articles, 'blogs/'+destBlogID+'/article');

}

getBlogCount();

})();
