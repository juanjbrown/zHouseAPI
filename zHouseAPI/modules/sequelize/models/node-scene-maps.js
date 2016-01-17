module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var NodeSceneMaps = sequelize.define('NodeSceneMaps',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      transmitted_scene_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      node_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      scene_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    NodeSceneMaps: NodeSceneMaps
  }
}