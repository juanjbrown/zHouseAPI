module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  NodeSceneTriggerScenes = sequelize.define('NodeSceneTriggerScenes',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      scene_trigger_id: {
        type: Sequelize.INTEGER
      },
      scene_id: {
        type: Sequelize.INTEGER
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    NodeSceneTriggerScenes: NodeSceneTriggerScenes
  }
}