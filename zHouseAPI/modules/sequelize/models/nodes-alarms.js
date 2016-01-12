module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var NodesAlarms = sequelize.define('NodesAlarms',
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
    NodesAlarms: NodesAlarms
  }
}