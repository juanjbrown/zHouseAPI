module.exports = function() {
  var config = require('../../config.js')[process.env.NODE_ENV];
  var Sequelize = require('sequelize');
  var Models = require('./models/_models.js');
  
  var sequelize = new Sequelize(config.database.database, config.database.user, config.database.password, {
    host: config.database.host,
    dialect: 'mysql',
    pool: {
      max: 1,
      min: 0,
      idle: 10000
    }
  });

  var models = new Models(sequelize);
  
  function addNode(nodeid) {
    models.nodes.findOrCreate({
      where: {
        node_id: nodeid
      },
      defaults: {
        node_id: nodeid
      }
    });
  }
  
  function initialize(callback) {
    sequelize.sync({
      force: false
    }).then(function() {
      callback();
    });
  }
  
  return {
    initialize: initialize,
    sequelize: sequelize,
    models: models,
    addNode: addNode
  }
}