module.exports = function(sequelize) {  
  var Alarm = require('./alarm.js');
  var alarm = new Alarm(sequelize).Alarm;
  
  var Cameras = require('./cameras.js');
  var cameras = new Cameras(sequelize).Cameras;
  
  var Nodes = require('./nodes.js');
  var nodes = new Nodes(sequelize).Nodes;
  
  var NodeAlarmTriggers = require('./node-alarm-triggers.js');
  var nodeAlarmTriggers = new NodeAlarmTriggers(sequelize).NodeAlarmTriggers;
  
  var NodeSceneTriggers = require('./node-scene-triggers.js');
  var nodeSceneTriggers = new NodeSceneTriggers(sequelize).NodeSceneTriggers;
  
  var NodeSceneTriggerScenes = require('./node-scene-trigger-scenes.js');
  var nodeSceneTriggerScenes = new NodeSceneTriggerScenes(sequelize).NodeSceneTriggerScenes;
  
  var Scenes = require('./scenes.js');
  var scenes = new Scenes(sequelize).Scenes;
  
  var SceneActions = require('./scene-actions.js');
  var sceneActions = new SceneActions(sequelize).SceneActions;
  
  var Users = require('./users.js');
  var users = new Users(sequelize).Users;
  
  nodes.hasMany(nodeAlarmTriggers, {as: 'alarm-triggers', foreignKey: 'node_id', onDelete: 'CASCADE'});  
  nodes.hasMany(nodeSceneTriggers, {as: 'scene-triggers', foreignKey: 'node_id', onDelete: 'CASCADE'});
  nodes.hasMany(sceneActions, {as: 'nodes', foreignKey: 'node_id', onDelete: 'CASCADE'});
  
  nodeSceneTriggers.hasMany(nodeSceneTriggerScenes, {as: 'scenes', foreignKey: 'nodes_scene_id', onDelete: 'CASCADE'});
  nodeSceneTriggers.belongsToMany(scenes, {through: nodeSceneTriggerScenes, foreignKey: 'scene_id'})
  scenes.belongsToMany(nodeSceneTriggers, {through: nodeSceneTriggerScenes, foreignKey: 'nodes_scene_id'});
  
  scenes.hasMany(sceneActions, {as: 'actions', foreignKey: 'scene_id', onDelete: 'CASCADE'});
  
  return {
    alarm: alarm,
    cameras: cameras,
    nodes: nodes,
    nodeAlarmTriggers: nodeAlarmTriggers,
    nodeSceneTriggers: nodeSceneTriggers,
    nodeSceneTriggerScenes: nodeSceneTriggerScenes,
    scenes: scenes,
    sceneActions: sceneActions,
    users: users
  }
}