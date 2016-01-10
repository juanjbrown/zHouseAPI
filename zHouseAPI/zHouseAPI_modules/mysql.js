module.exports = function() {
  var serializer = require('./serializer.js');
  var crypto = require('crypto');
  var uuid = require('node-uuid');
  var mysql = require('mysql');
  var config = require('../config.js');
  var pool;
  
  function connect() {
    pool = mysql.createPool({
      connectionLimit: 10,
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database
    });
  }

  function disconnect() {
    pool.end();
  }
  
  function authenticate(username, apikey, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('SELECT * FROM users WHERE username=? AND api_key=?;', [username, apikey], function (error, results, fields) {
        var status;
        var response = {};
        if(results.length === 0) {
          status = 403;
          response.status = 'error';
          response.data = 'not authorized';
        }
        callback(status, response);
        connection.release();
      });
    });
  }
  
  //alarm
  function getAlarm(callback) {
    pool.getConnection(function(err, connection) {
      connection.query('SELECT * FROM alarm', function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function updateAlarm(alarm, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('UPDATE alarm SET ? WHERE id=0', [alarm], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  //cameras
  function getCameras(callback) {
    pool.getConnection(function(err, connection) {
      connection.query('SELECT * FROM cameras', function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function createCamera(camera, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('INSERT INTO cameras SET ?;', [camera], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function getCamera(cameraid, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('SELECT * FROM cameras WHERE id=?;', [cameraid], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.length === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'camera id does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results[0];
          callback(status, response);
        }
        connection.release();
      });
    });
  }

  function updateCamera(cameraid, camera, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('UPDATE cameras SET ? WHERE id=?', [camera, cameraid], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'camera id does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function deleteCamera(cameraid, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('DELETE FROM cameras WHERE id=?', [cameraid], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'camera id does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  //login
  function login(credentials, callback) {
    credentials.password = getsha256(credentials.password);
    pool.getConnection(function(err, connection) {
      connection.query('SELECT * FROM users WHERE username=? AND password=?;', [credentials.username, credentials.password], function (error, results, fields) {
        var status;
        var response = {};
        if(results.length === 0) {
          status = 403;
          response.status = 'error';
          response.data = 'incorrect credentials';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = {apikey: results[0].api_key};
          callback(status, response);
        }
        connection.release();
      });
    });
  }

  //nodes  
  function getNodes(callback) {
    pool.getConnection(function(err, connection) {
      var query = '\
        SELECT * FROM nodes \
        LEFT JOIN nodes_alarm ON nodes.node_id=nodes_alarm.node_id \
        LEFT JOIN nodes_scenes ON nodes.node_id=nodes_scenes.node_id \
        LEFT JOIN nodes_scenes_xref_scenes ON nodes_scenes.id=nodes_scenes_xref_scenes.nodes_scenes_id \
        LEFT JOIN scenes ON nodes_scenes_xref_scenes.scenes_id=scenes.id \
        ORDER BY nodes.node_id';
      connection.query({sql: query, nestTables: true}, function (error, results, fields) {
        var status;
        var response = {};
        var nestingOptions = [
          {tableName: 'nodes', pkey: 'node_id'},
          {tableName: 'nodes_alarm', pkey: 'id', fkeys:[{table:'nodes',col:'node_id'}]},
          {tableName: 'nodes_scenes', pkey: 'id', fkeys:[{table:'nodes',col:'node_id'}]},
          {tableName: 'nodes_scenes_xref_scenes', pkey: 'id', fkeys:[{table:'nodes_scenes',col:'nodes_scenes_id'},{table:'scenes',col:'scenes_id'}]},
          {tableName: 'scenes', pkey: 'id'}
        ];
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          var results = serializer.convertToNested(results, nestingOptions);
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }

  function getNode(nodeid, callback) {
    pool.getConnection(function(err, connection) {
      var query = '\
        SELECT * FROM nodes \
        LEFT JOIN nodes_alarm ON nodes.node_id=nodes_alarm.node_id \
        LEFT JOIN nodes_scenes ON nodes.node_id=nodes_scenes.node_id \
        LEFT JOIN nodes_scenes_xref_scenes ON nodes_scenes.id=nodes_scenes_xref_scenes.nodes_scenes_id \
        LEFT JOIN scenes ON nodes_scenes_xref_scenes.scenes_id=scenes.id \
        ORDER BY nodes.node_id';
      connection.query({sql: query, nestTables: true}, function (error, results, fields) {
        var status;
        var response = {};
        var nestingOptions = [
          {tableName: 'nodes', pkey: 'node_id'},
          {tableName: 'nodes_alarm', pkey: 'id', fkeys:[{table:'nodes',col:'node_id'}]},
          {tableName: 'nodes_scenes', pkey: 'id', fkeys:[{table:'nodes',col:'node_id'}]},
          {tableName: 'nodes_scenes_xref_scenes', pkey: 'id', fkeys:[{table:'nodes_scenes',col:'nodes_scenes_id'},{table:'scenes',col:'scenes_id'}]},
          {tableName: 'scenes', pkey: 'id'}
        ];
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.length === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'node id does not exist';
          callback(status, response);
        } else {
          var results = serializer.convertToNested(results, nestingOptions);
          for(var i=0;i<results.length;i++) {
            if(results[i].node_id == nodeid) {
              results = results[i];
            }
          }
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }

  function updateNode(nodeid, node, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('UPDATE nodes SET ? WHERE node_id=?', [node, nodeid], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'node id does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function createNodeAlarm(nodeid, alarm, callback) {
    alarm.node_id = nodeid;
    pool.getConnection(function(err, connection) {
      connection.query('INSERT INTO nodes_alarm SET ?;', [alarm], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function updateNodeAlarm(alarm_id, alarm, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('UPDATE nodes_alarm SET ? WHERE id=?', [alarm, alarm_id], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'node alarm id does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function deleteNodeAlarm(alarm_id, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('DELETE FROM nodes_alarm WHERE id=?', [alarm_id], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if (results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'node alarm id does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function createNodeScene(node_id, scene, callback) {
    scene.node_id = node_id;
    pool.getConnection(function(err, connection) {
      connection.query('INSERT INTO nodes_scenes SET ?;', [scene], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function updateNodeScene(scene_id, scene, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('UPDATE nodes_scenes SET ? WHERE id=?', [scene, scene_id], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'node scene id does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function deleteNodeScene(scene_id, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('DELETE FROM nodes_scenes WHERE id=?', [scene_id], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if (results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'node scene id does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function createNodeSceneXref(scene_id, sceneXref, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('INSERT INTO nodes_scenes_xref_scenes SET ?;', [{nodes_scenes_id: scene_id, scenes_id: sceneXref}], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function deleteNodeSceneXref(scene_id, sceneXref, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('DELETE FROM nodes_scenes_xref_scenes WHERE nodes_scenes_id=? AND scenes_id=?', [scene_id, sceneXref], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if (results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'node scene reference id does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function addNode(nodeid, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('INSERT IGNORE INTO nodes (node_id) VALUES ("'+nodeid+'");', function (error, results, fields) {
        callback();
        connection.release();
      });  
    });
  }

  function deleteAllNodes(callback) {
    pool.getConnection(function(err, connection) {
      connection.query('DELETE FROM nodes WHERE 1;', function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 400;
          response.status = 'error';
          response.data = 'no nodes to delete';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });  
    });
  }
  
  //scenes
  function getScenes(callback) {
    pool.getConnection(function(err, connection) {
      var query = 'SELECT * FROM scenes \
      LEFT JOIN scenes_actions ON scenes.id=scenes_actions.scenes_id \
      LEFT JOIN nodes ON scenes_actions.node_id=nodes.node_id';
      connection.query({sql: query, nestTables: true}, function (error, results, fields) {
        var status;
        var response = {};
        var nestingOptions = [
          {tableName: 'scenes', pkey: 'id'},
          {tableName: 'scenes_actions', pkey: 'id', fkeys:[{table:'scenes',col:'scenes_id'},{table:'nodes',col:'node_id'}]},
          {tableName: 'nodes', pkey: 'node_id'}
        ];
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          var results = serializer.convertToNested(results, nestingOptions);
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function createScene(scene, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('INSERT INTO scenes SET ?;', [scene], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function getScene(sceneid, callback) {
    pool.getConnection(function(err, connection) {
      var query = 'SELECT * FROM scenes \
      LEFT JOIN scenes_actions ON scenes.id=scenes_actions.scenes_id \
      LEFT JOIN nodes ON scenes_actions.node_id=nodes.node_id';
      connection.query({sql: query, nestTables: true}, [sceneid], function (error, results, fields) {
        var nestingOptions = [
          {tableName: 'scenes', pkey: 'id'},
          {tableName: 'scenes_actions', pkey: 'id', fkeys:[{table:'scenes',col:'scenes_id'},{table:'nodes',col:'node_id'}]},
          {tableName: 'nodes', pkey: 'node_id'}
        ];
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.length === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'scene id does not exist';
          callback(status, response);
        } else {
          var results = serializer.convertToNested(results, nestingOptions);
          for(var i=0;i<results.length;i++) {
            if(results[i].id == sceneid) {
              results = results[i];
            }
          }
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }

  function updateScene(sceneid, scene, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('UPDATE scenes SET ? WHERE id=?', [scene, sceneid], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'scene id does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function deleteScene(sceneid, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('DELETE FROM scenes WHERE id=?', [sceneid], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if (results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'scene id does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }

  //schedules
  function getSchedules(callback) {
    pool.getConnection(function(err, connection) {
      var query = 'SELECT * FROM schedules \
      LEFT JOIN schedules_xref_scenes ON schedules.id=schedules_xref_scenes.schedules_id \
      LEFT JOIN scenes ON schedules_xref_scenes.scenes_id=scenes.id;';
      connection.query({sql: query, nestTables: true}, function (error, results, fields) {
        var status;
        var response = {};
        var nestingOptions = [
          {tableName: 'schedules', pkey: 'id'},
          {tableName: 'schedules_xref_scenes', pkey: 'id', fkeys:[{table:'schedules',col:'schedules_id'},{table:'scenes',col:'scenes_id'}]},
          {tableName: 'scenes', pkey: 'id'}
        ];
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          var results = serializer.convertToNested(results, nestingOptions);
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function createSchedule(schedule, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('INSERT INTO schedules SET ?;', [schedule], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function getSchedule(scheduleid, callback) {
    pool.getConnection(function(err, connection) {
      var query = 'SELECT * FROM schedules \
      LEFT JOIN schedules_xref_scenes ON schedules.id=schedules_xref_scenes.schedules_id \
      LEFT JOIN scenes ON schedules_xref_scenes.scenes_id=scenes.id;';
      connection.query({sql: query, nestTables: true}, function (error, results, fields) {
        var status;
        var response = {};
        var nestingOptions = [
          {tableName: 'schedules', pkey: 'id'},
          {tableName: 'schedules_xref_scenes', pkey: 'id', fkeys:[{table:'schedules',col:'schedules_id'},{table:'scenes',col:'scenes_id'}]},
          {tableName: 'scenes', pkey: 'id'}
        ];
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          var results = serializer.convertToNested(results, nestingOptions);
          for(var i=0;i<results.length;i++) {
            if(results[i].id == scheduleid) {
              results = results[i];
            }
          }
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }

  function updateSchedule(scheduleid, schedule, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('UPDATE schedules SET ? WHERE id=?', [schedule, scheduleid], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'schedule id does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function deleteSchedule(scheduleid, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('DELETE FROM schedules WHERE id=?', [scheduleid], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'schedule id does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  //users
  function getUsers(callback) {
    pool.getConnection(function(err, connection) {
      connection.query('SELECT * FROM users', function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          for(var i=0;i<results.length;i++) {
            delete results[i].password;
          }
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function createUser(user, callback) {
    user.password = getsha256(user.password);
    user.api_key = uuid.v4();
    pool.getConnection(function(err, connection) {
      connection.query('INSERT INTO users SET ?;', [user], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function getUser(username, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('SELECT * FROM users WHERE username=?;', [username], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.length === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'user does not exist';
          callback(status, response);
        } else {
          delete results[0].password;
          status = 200;
          response.status = 'success';
          response.data = results[0];
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function forgotPassword(email, callback) {
    var forgotpasswordkey = uuid.v4();
    pool.getConnection(function(err, connection) {
      connection.query('UPDATE users SET ? WHERE email=?', [{"forgot_password_key": forgotpasswordkey}, email], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = 'an email will be sent to the address you provided.';
          callback(status, response);
        }
        connection.release();
        //TODO: send email to email address with link to change password
      });
    });
  }
  
  function changeUsername(oldusername, newusername, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('UPDATE users SET ? WHERE username=?', [{"username": newusername}, oldusername], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'user does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function changeEmail(username, email, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('UPDATE users SET ? WHERE username=?', [{"email": email}, username], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'user does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function changePassword(username, password, callback) {
    password = getsha256(password);
    var apikey = uuid.v4();
    pool.getConnection(function(err, connection) {
      connection.query('UPDATE users SET ? WHERE username=?', [{"password": password, "api_key": apikey, "forgot_password_key": ''}, username], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'user does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          response.newkey = apikey;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function changeRole(username, role, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('UPDATE users SET ? WHERE username=?', [{"role": role}, username], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'user does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  function deleteUser(username, callback) {
    pool.getConnection(function(err, connection) {
      connection.query('DELETE FROM users WHERE username=?', [username], function (error, results, fields) {
        var status;
        var response = {};
        if(error) {
          status = 400;
          response.status = 'error';
          response.data = error;
          callback(status, response);
        } else if(results.affectedRows === 0) {
          status = 404;
          response.status = 'error';
          response.data = 'username does not exist';
          callback(status, response);
        } else {
          status = 200;
          response.status = 'success';
          response.data = results;
          callback(status, response);
        }
        connection.release();
      });
    });
  }
  
  //sha256 helper
  function getsha256(message) {
    return crypto.createHash('sha256').update(message, 'utf8').digest('hex');
  }

  return {
    authenticate: authenticate,
    connect: connect,
    disconnect: disconnect,
    
    //alarm
    getAlarm: getAlarm,
    updateAlarm: updateAlarm,
    
    //cameras
    createCamera: createCamera,
    getCameras: getCameras,
    getCamera: getCamera,
    updateCamera: updateCamera,
    deleteCamera: deleteCamera,
    
    //login
    login: login,
    
    //nodes
    getNodes: getNodes,
    getNode: getNode,
    updateNode: updateNode,
    createNodeAlarm: createNodeAlarm,
    updateNodeAlarm: updateNodeAlarm,
    deleteNodeAlarm: deleteNodeAlarm,
    createNodeScene: createNodeScene,
    updateNodeScene: updateNodeScene,
    deleteNodeScene: deleteNodeScene,
    createNodeSceneXref: createNodeSceneXref,
    deleteNodeSceneXref: deleteNodeSceneXref,
    addNode: addNode,
    deleteAllNodes: deleteAllNodes,
    
    //scenes
    createScene: createScene,
    getScenes: getScenes,
    getScene: getScene,
    updateScene: updateScene,
    deleteScene: deleteScene,
    
    //schedules
    createSchedule: createSchedule,
    getSchedules: getSchedules,
    getSchedule: getSchedule,
    updateSchedule: updateSchedule,
    deleteSchedule: deleteSchedule,
    
    //users
    getUsers: getUsers,
    createUser: createUser,
    getUser: getUser,
    forgotPassword: forgotPassword,
    changeUsername: changeUsername,
    changeEmail: changeEmail,
    changePassword: changePassword,
    changeRole: changeRole,
    deleteUser: deleteUser
  }
}