module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var Nodes = sequelize.define('Nodes',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      node_id: {
        type: Sequelize.INTEGER,
        unique: true
      },
      name: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    Nodes: Nodes
  }
}