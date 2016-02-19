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
      record_url: {
        type: Sequelize.STRING,
        allowNull: false
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