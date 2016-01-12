module.exports = function(sequelize) {  
  var Alarm = require('./alarm.js');
  var alarm = new Alarm(sequelize).Alarm;
  
  var Cameras = require('./cameras.js');
  var cameras = new Cameras(sequelize).Cameras;
  
  var Nodes = require('./nodes.js');
  var nodes = new Nodes(sequelize).Nodes;
  
  var NodesAlarm = require('./nodes-alarm.js');
  var nodesAlarm = new NodesAlarm(sequelize).NodesAlarm;
  
  var NodesScenes = require('./nodes-scenes.js');
  var nodesScenes = new NodesScenes(sequelize).NodesScenes;
  
  var Scenes = require('./scenes.js');
  var scenes = new Scenes(sequelize).Scenes;
  
  var Users = require('./users.js');
  var users = new Users(sequelize).Users;
  
  nodes.hasMany(nodesAlarm, {as: 'alarm'});
  nodesAlarm.belongsTo(nodes);
  
  nodes.hasMany(nodesScenes, {as: 'scenes'});
  nodesScenes.belongsTo(nodes);
  
  nodesScenes.belongsToMany(nodes, {through: 'NodesNodesScenes'});
  nodesScenes.belongsToMany(scenes, {through: 'NodesNodesScenes'});
  
  return {
    alarm: alarm,
    cameras: cameras,
    nodes: nodes,
    nodesAlarm: nodesAlarm,
    nodesScenes: nodesScenes,
    users: users
  }
}