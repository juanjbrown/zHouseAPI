module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var Cameras = sequelize.define('Cameras',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      up_url: {
        type: Sequelize.STRING
      },
      down_url: {
        type: Sequelize.STRING
      },
      left_url: {
        type: Sequelize.STRING
      },
      right_url: {
        type: Sequelize.STRING
      },
      record_on_alarm: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    Cameras: Cameras
  }
}