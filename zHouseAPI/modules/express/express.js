module.exports = function() {
  var http = require('http');
  
  //initialize server 
  var server;
  var app;
  var express = require('express');
  var bodyParser = require('body-parser');
  var app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: false
  }));
  server = http.createServer(app);
  
  return {
    app: app,
    server: server
  }
}