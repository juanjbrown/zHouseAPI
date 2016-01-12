module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var Alarm = sequelize.define('Alarm',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      armed: {
        type: Sequelize.BOOLEAN,
        default: false,
        allowNull: false
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    Alarm: Alarm
  }
}