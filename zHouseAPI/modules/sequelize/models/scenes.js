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
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      armed: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      dawn: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      dusk: {
        type: Sequelize.BOOLEAN,
        allowNull: false
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