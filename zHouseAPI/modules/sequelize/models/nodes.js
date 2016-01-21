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
      floor: {
        type: Sequelize.INTEGER
      },
      room: {
        type: Sequelize.STRING,
        default: null
      },
      type: {
        type: Sequelize.STRING,
        default: null
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