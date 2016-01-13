module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  ScheduleScenes = sequelize.define('ScheduleScenes',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      schedule_id: {
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
    ScheduleScenes: ScheduleScenes
  }
}