module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var Users = sequelize.define('Users', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    username: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    role: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        isInt: true
      }
    }
  });
  
  return {
    Users: Users
  }
}