module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var NodeCategories = sequelize.define('NodeCategories',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      node_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    NodeCategories: NodeCategories
  }
}