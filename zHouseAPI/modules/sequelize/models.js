module.exports = function(sequelize) {
  var Users = require('./users.js');
  var users = new Users(sequelize).Users;
  
  var Nodes = require('./nodes.js');
  var nodes = new Nodes(sequelize).Nodes;
  
  return {
    users: users,
    nodes: nodes
  }
}