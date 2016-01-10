module.exports = function(app, sequelize) {
  var epilogue = require('epilogue');
  
  epilogue.initialize({
    app: app.app,
    sequelize: sequelize.sequelize
  });
    
  var usersResource = epilogue.resource({
    model: sequelize.models.users,
    endpoints: ['/users', '/users/:id']
  });
  
  var nodesResource = epilogue.resource({
    model: sequelize.models.nodes,
    endpoints: ['/nodes', '/nodes/:node_id']
  });
}