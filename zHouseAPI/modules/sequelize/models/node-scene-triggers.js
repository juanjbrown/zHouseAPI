module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var NodeSceneTriggers = sequelize.define('NodeSceneTriggers',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      class_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    NodeSceneTriggers: NodeSceneTriggers
  }
}