module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var NodeAlarmTriggers = sequelize.define('NodeAlarmTriggers',
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
      },
      sms: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      siren: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    NodeAlarmTriggers: NodeAlarmTriggers
  }
}