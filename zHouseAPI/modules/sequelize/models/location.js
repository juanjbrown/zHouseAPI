module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var Location = sequelize.define('Location',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      latitude: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      longitude: {
        type: Sequelize.FLOAT,
        allowNull: false
      } 
    },
    {
      timestamps: false
    }
  );
  
  return {
    Location: Location
  }
}