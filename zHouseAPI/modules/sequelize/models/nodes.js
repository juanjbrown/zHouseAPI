module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var Nodes = sequelize.define('Nodes',
    {
      node_id: {
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      },
      room: {
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