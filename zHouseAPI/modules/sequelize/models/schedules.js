module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var Schedules = sequelize.define('Schedules',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING
      },
      cron: {
        type: Sequelize.STRING,
        allowNull: false
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    Schedules: Schedules
  }
}