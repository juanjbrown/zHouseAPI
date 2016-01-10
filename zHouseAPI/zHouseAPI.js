var Sequelize = require('sequelize');
var epilogue = require('epilogue');
var http = require('http');
var config = require('./config.js')[process.env.NODE_ENV];

// Define your models 
var database = new Sequelize(config.database.database, config.database.user, config.database.password, {
  host: config.database.host,
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }
});

var User = database.define('User', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  username: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      isInt: true
    }
  }
});

// Initialize server 
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

// Initialize epilogue 
epilogue.initialize({
  app: app,
  sequelize: database
});

// Create REST resource 
var userResource = epilogue.resource({
  model: User,
  endpoints: ['/users', '/users/:id']
});

// Create database and listen 
database
  .sync({
    force: true
  })
  .then(function () {
    server.listen(config.server.port, config.server.host, function () {
      var host = server.address().address,
        port = server.address().port;

      console.log('listening at http://%s:%s', host, port);
    });
  });