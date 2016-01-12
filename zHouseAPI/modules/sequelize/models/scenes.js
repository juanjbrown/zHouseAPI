module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var Scenes = sequelize.define('Scenes',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING
      },
      change_alarm: {
        type: Sequelize.BOOLEAN
      },
      armed: {
        type: Sequelize.BOOLEAN
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    Scenes: Scenes
  }
}