module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var Nodes = sequelize.define('Nodes', {
    node_id: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    type: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    }
  });
  
  return {
    Nodes: Nodes
  }
}