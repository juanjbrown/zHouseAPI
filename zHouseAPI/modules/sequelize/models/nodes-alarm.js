module.exports = function(sequelize, nodes) {
  var Sequelize = require('sequelize');
  
  var NodesAlarm = sequelize.define('NodesAlarm',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      class_id: {
        type: Sequelize.INTEGER
      },
      value: {
        type: Sequelize.STRING
      },
      sms: {
        type: Sequelize.BOOLEAN
      },
      siren: {
        type: Sequelize.BOOLEAN
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    NodesAlarm: NodesAlarm
  }
}