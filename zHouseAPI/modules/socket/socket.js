module.exports = function(sequelize) {
  var io = require('socket.io')();  
  io.listen(3001);
  
  io.on('connection', function(client) {
    var username = getCookie('username', client.handshake.headers.cookie);
    var apikey = getCookie('apikey', client.handshake.headers.cookie);
    
    sequelize.models.users.findOne({
      where: {
        username: username,
        apikey: apikey
      }
    }).then(function(user) {
      if(user) {
        //authenticated
      } else {
        console.log('disconnecting');
        client.disconnect();
      }
    });
  });
  
  function updateNodes(nodes) {
    io.emit('updateNodes', nodes);
  }
  
  function getCookie(c_name, cookies) {
    var c_value = " " + cookies;
    var c_start = c_value.indexOf(" " + c_name + "=");
    if (c_start == -1) {
      c_value = null;
    } else {
      c_start = c_value.indexOf("=", c_start) + 1;
      var c_end = c_value.indexOf(";", c_start);
      if (c_end == -1) {
        c_end = c_value.length;
      }
      c_value = unescape(c_value.substring(c_start, c_end));
    }
    return c_value;
  }
  
  return {
    updateNodes: updateNodes
  }
}