module.exports = function(sequelize) {  
  var Alarm = require('./alarm.js');
  var alarm = new Alarm(sequelize).Alarm;
  
  var Cameras = require('./cameras.js');
  var cameras = new Cameras(sequelize).Cameras;
  
  var Nodes = require('./nodes.js');
  var nodes = new Nodes(sequelize).Nodes;
  
  var NodesAlarms = require('./nodes-alarms.js');
  var nodesAlarms = new NodesAlarms(sequelize).NodesAlarms;
  
  var NodesScenes = require('./nodes-scenes.js');
  var nodesScenes = new NodesScenes(sequelize).NodesScenes;
  
  var Scenes = require('./scenes.js');
  var scenes = new Scenes(sequelize).Scenes;
  
  var ScenesActions = require('./scenes-actions.js');
  var scenesActions = new ScenesActions(sequelize).ScenesActions;
  
  var Users = require('./users.js');
  var users = new Users(sequelize).Users;
  
  nodes.hasMany(nodesAlarms, {as: 'alarms', foreignKey: 'node_id'});  
  nodes.hasMany(nodesScenes, {as: 'scenes', foreignKey: 'node_id'});
  nodes.hasMany(scenesActions, {as: 'nodes', foreignKey: 'node_id'});
  
  nodesScenes.belongsToMany(nodes, {through: 'NodesNodesScenes'});
  nodesScenes.belongsToMany(scenes, {through: 'NodesNodesScenes'});
  
  scenes.hasMany(scenesActions, {as: 'actions', foreignKey: 'scene_id'});
  
  return {
    alarm: alarm,
    cameras: cameras,
    nodes: nodes,
    nodesAlarms: nodesAlarms,
    nodesScenes: nodesScenes,
    scenes: scenes,
    scenesActions: scenesActions,
    users: users
  }
}