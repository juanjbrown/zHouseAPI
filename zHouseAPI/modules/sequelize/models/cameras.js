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
        type: Sequelize.STRING
      },
      camera_key: {
        type: Sequelize.STRING
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