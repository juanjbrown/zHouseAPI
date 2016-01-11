module.exports = function(sequelize) {
  var Users = require('./users.js');
  var users = new Users(sequelize).Users;
  
  var Nodes = require('./nodes.js');
  var nodes = new Nodes(sequelize).Nodes;
  
  var NodesAlarm = require('./nodes-alarm.js');
  var nodesAlarm = new NodesAlarm(sequelize, nodes).NodesAlarm;
  
  nodes.hasMany(nodesAlarm, {as: 'alarm'});
  nodesAlarm.belongsTo(nodes);
  
  return {
    users: users,
    nodes: nodes,
    nodesAlarm: nodesAlarm
  }
}