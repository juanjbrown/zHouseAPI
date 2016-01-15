module.exports = function(sequelize) {
  var Sequelize = require('sequelize');
  
  var Users = sequelize.define('Users',
    {
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
      },
      apikey: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true
      },
      forgotpasswordkey: {
        type: Sequelize.UUID,
        unique: true
      },
      password_has_changed: {
        type: Sequelize.BOOLEAN,
        required: false,
        defaultValue: false
      }
    },
    {
      timestamps: false
    }
  );
  
  return {
    Users: Users
  }
}