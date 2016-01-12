module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var NodesScenes = sequelize.define('NodesScenes',
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
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    NodesScenes: NodesScenes
  }
}