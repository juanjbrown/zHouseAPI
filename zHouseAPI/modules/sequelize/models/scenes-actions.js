module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var ScenesActions = sequelize.define('ScenesActions',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING
      },
      class_id: {
        type: Sequelize.INTEGER
      },
      instance: {
        type: Sequelize.INTEGER
      },
      index: {
        type: Sequelize.INTEGER
      },
      value: {
        type: Sequelize.STRING
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    ScenesActions: ScenesActions
  }
}