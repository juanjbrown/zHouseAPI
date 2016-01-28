module.exports = function(sequelize) {  
  var Alarm = require('./alarm.js');
  var alarm = new Alarm(sequelize).Alarm;
  
  var Cameras = require('./cameras.js');
  var cameras = new Cameras(sequelize).Cameras;
  
  var Location = require('./location.js');
  var location = new Location(sequelize).Location;
  
  var Nodes = require('./nodes.js');
  var nodes = new Nodes(sequelize).Nodes;
  
  var NodeSceneMaps = require('./node-scene-maps.js');
  var nodeSceneMaps = new NodeSceneMaps(sequelize).NodeSceneMaps;
  
  var NodeAlarmTriggers = require('./node-alarm-triggers.js');
  var nodeAlarmTriggers = new NodeAlarmTriggers(sequelize).NodeAlarmTriggers;
  
  var NodeSceneTriggers = require('./node-scene-triggers.js');
  var nodeSceneTriggers = new NodeSceneTriggers(sequelize).NodeSceneTriggers;
  
  var NodeSceneTriggerScenes = require('./node-scene-trigger-scenes.js');
  var nodeSceneTriggerScenes = new NodeSceneTriggerScenes(sequelize).NodeSceneTriggerScenes;
  
  var NodeCategories = require('./node-categories.js');
  var nodeCategories = new NodeCategories(sequelize).NodeCategories;
  
  var Scenes = require('./scenes.js');
  var scenes = new Scenes(sequelize).Scenes;
  
  var SceneActions = require('./scene-actions.js');
  var sceneActions = new SceneActions(sequelize).SceneActions;
  
  var Schedules = require('./schedules.js');
  var schedules = new Schedules(sequelize).Schedules;
  
  var ScheduleScenes = require('./schedule-scenes.js');
  var scheduleScenes = new ScheduleScenes(sequelize).ScheduleScenes;
  
  var Users = require('./users.js');
  var users = new Users(sequelize).Users;
  
  nodes.hasMany(nodeSceneMaps, {as: 'scene_maps', foreignKey: 'node_id', onDelete: 'CASCADE'});
  nodes.hasMany(nodeAlarmTriggers, {as: 'alarm_triggers', foreignKey: 'node_id', onDelete: 'CASCADE'});  
  nodes.hasMany(nodeSceneTriggers, {as: 'scene_triggers', foreignKey: 'node_id', onDelete: 'CASCADE'});
  nodes.hasMany(sceneActions, {as: 'nodes', foreignKey: 'node_id', onDelete: 'CASCADE'});
  nodes.hasMany(nodeCategories, {as: 'categories', foreignKey: 'node_id', onDelete: 'CASCADE'});
  
  nodeSceneTriggers.hasMany(nodeSceneTriggerScenes, {as: 'scenes', foreignKey: 'scene_trigger_id', onDelete: 'CASCADE'});
  nodeSceneTriggers.belongsToMany(scenes, {through: nodeSceneTriggerScenes, foreignKey: 'scene_trigger_id'})
  scenes.belongsToMany(nodeSceneTriggers, {through: nodeSceneTriggerScenes, foreignKey: 'scene_id'});
  
  scenes.hasMany(sceneActions, {as: 'actions', foreignKey: 'scene_id', onDelete: 'CASCADE'});
  scenes.hasMany(nodeSceneMaps, {as: 'scene_maps', foreignKey: 'scene_id', onDelete: 'CASCADE'});
  
  schedules.hasMany(scheduleScenes, {as: 'scenes', foreignKey: 'schedule_id', onDelete: 'CASCADE'});
  schedules.belongsToMany(scenes, {through: scheduleScenes, foreignKey: 'schedule_id'})
  scenes.belongsToMany(schedules, {through: scheduleScenes, foreignKey: 'scene_id'});
  
  return {
    alarm: alarm,
    cameras: cameras,
    location: location,
    nodes: nodes,
    nodeSceneMaps: nodeSceneMaps,
    nodeAlarmTriggers: nodeAlarmTriggers,
    nodeSceneTriggers: nodeSceneTriggers,
    nodeSceneTriggerScenes: nodeSceneTriggerScenes,
    nodeCategories: nodeCategories,
    scenes: scenes,
    sceneActions: sceneActions,
    schedules: schedules,
    scheduleScenes: scheduleScenes,
    users: users
  }
}