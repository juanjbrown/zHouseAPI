module.exports = function(schedulesParam, sequelize) {
  var ExpressBrute = require('express-brute');
  var store = new ExpressBrute.MemoryStore();
  var bruteforce = new ExpressBrute(store);
  var url = require ('url');
  var http = require('http');
  var cors = require('cors');
  var express = require('express');
  var app = express();
  var bodyParser = require('body-parser');
  var schedules = schedulesParam;
  var router = express.Router();
  var serversStarted = false;
  
  //proxy
  router.post('/proxy', function(req, res) {
    http.request(req.body.url, function(){
      res.status(200).json({status:'success'});
    }).end();
  });
  
  //authentication
  function authenticate(req, res, next) {
    if(req.path === '/login') {
      return next();
    }
    
    if(req.path === '/users/forgotpassword') {
      return next();
    }
    
    if(req.path === '/users/forgotpassword/changepassword') {
      return next();
    }
    
    if(req.method === 'OPTIONS') {
      return next();
    }
    
    return next();
    
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) {
      if(user) {
        return next();
      } else {
        res.status(403).json({
          status: 'error',
          data: 'not authorized'
        });
      }
    });
  }
  
  //login
  router.post('/login', bruteforce.prevent, function(req, res) {
    GLOBAL.mysqlGlobal.login(req.body, function(status, response) {
      res.status(status).json(response);
    });
  });

  //nodes
  router.get('/nodes', function(req, res) {
    sequelize.models.nodes.findAll({
      include: [{
        model: sequelize.models.nodesAlarm,
        as: 'alarm',
        required: false
      }]
    }).then(function(nodes) {
      res.status(200).json({
        status: 'success',
        data: nodes
      });
    });
  });

  router.get('/nodes/:id', function(req, res) {
    GLOBAL.mysqlGlobal.getNode(req.params.id, function(status, response) {
      if(response.status === 'success') {
        response.data.node = GLOBAL.zwaveGlobal.nodes[req.params.id];
      }
      res.status(status).json(response);
    });
  });

  router.put('/nodes/:id', function(req, res) {
    GLOBAL.mysqlGlobal.updateNode(req.params.id, req.body, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.post('/nodes/:id/alarm', function(req, res) {
    GLOBAL.mysqlGlobal.createNodeAlarm(req.params.id, req.body, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.put('/nodes/alarm/:id', function(req, res) {
    GLOBAL.mysqlGlobal.updateNodeAlarm(req.params.id, req.body, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.delete('/nodes/alarm/:id', function(req, res) {
    GLOBAL.mysqlGlobal.deleteNodeAlarm(req.params.id, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.post('/nodes/:id/scenes', function(req, res) {
    GLOBAL.mysqlGlobal.createNodeScene(req.params.id, req.body, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.put('/nodes/scenes/:id', function(req, res) {
    GLOBAL.mysqlGlobal.updateNodeScene(req.params.id, req.body, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.delete('/nodes/scenes/:id', function(req, res) {
    GLOBAL.mysqlGlobal.deleteNodeScene(req.params.id, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.post('/nodes/scenes/:id/add', function(req, res) {
    GLOBAL.mysqlGlobal.createNodeSceneXref(req.params.id, req.body.scene_id, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.delete('/nodes/scenes/:id/delete', function(req, res) {
    GLOBAL.mysqlGlobal.deleteNodeSceneXref(req.params.id, req.body.scene_id, function(status, response) {
      res.status(status).json(response);
    });
  });

  router.put('/nodes/:id/command', function(req, res) {
    GLOBAL.mysqlGlobal.getNodes(function(status, response) {
      var exists = false;
      if(response.status === 'success') {
        for(var i=0;i<response.data.length;i++) {
          if(response.data[i].node_id == req.params.id) {
            exists = true;
          }
        }
        if(!exists) {
          res.status(400).json({
            'status': 'error',
            'message': 'node id does not exist'
          });
        } else {
          if(GLOBAL.zwaveGlobal.nodes[req.params.id].ready) {
            GLOBAL.zwaveGlobal.setValue(req.params.id, req.body, function(status, response) {
              res.status(status).json(response);
            });
          } else {
            res.status(400).json({
              'status': 'error',
              'message': 'node not ready'
            });
          }
        }
      } else {
        res.status(status).json(response);
      }
    });
  });
  
  router.put('/nodes/:id/config', function(req, res) {
    GLOBAL.mysqlGlobal.getNodes(function(status, response) {
      var exists = false;
      if(response.status === 'success') {
        for(var i=0;i<response.data.length;i++) {
          if(response.data[i].node_id == req.params.id) {
            exists = true;
          }
        }
        if(!exists) {
          res.status(400).json({
            'status': 'error',
            'message': 'node id does not exist'
          });
        } else {
          GLOBAL.zwaveGlobal.setConfigParam(req.params.id, req.body, function(status, response) {
            res.status(status).json(response);
          });
        }
      } else {
        res.status(status).json(response);
      }
    });
  });
  
  router.put('/nodes/:id/polling', function(req, res) {
    GLOBAL.mysqlGlobal.getNodes(function(status, response) {
      var exists = false;
      if(response.status === 'success') {
        for(var i=0;i<response.data.length;i++) {
          if(response.data[i].node_id == req.params.id) {
            exists = true;
          }
        }
        if(!exists) {
          res.status(400).json({
            'status': 'error',
            'message': 'node id does not exist'
          });
        } else {
          GLOBAL.zwaveGlobal.changePolling(req.params.id, req.body, function(status, response) {
            res.status(status).json(response);
          });
        }
      } else {
        res.status(status).json(response);
      }
    });
  });

  //controller
  router.get('/controller/reset', function(req, res) {
    GLOBAL.mysqlGlobal.deleteAllNodes(function(status, response) {
      if(status === 200) {
        GLOBAL.zwaveGlobal.controllerReset(function(status, response) {
          GLOBAL.zwaveGlobal.restart();
          res.status(status).json(response);
        });
      } else {
        res.status(status).json(response);
      }
    });
  });

  //schedules
  router.post('/schedules', function(req, res) {
    GLOBAL.mysqlGlobal.createSchedule(req.body, function(status, response) {
      res.status(status).json(response);
      if(status === 200) {
        schedules.reloadSchedules();
      }
    });
  });
  
  router.get('/schedules', function(req, res) {
    GLOBAL.mysqlGlobal.getSchedules(function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.get('/schedules/:id', function(req, res) {
    GLOBAL.mysqlGlobal.getSchedule(req.params.id, function(status, response) {
      res.status(status).json(response);
    });
  });

  router.put('/schedules/:id', function(req, res) {
    GLOBAL.mysqlGlobal.updateSchedule(req.params.id, req.body, function(status, response) {
      res.status(status).json(response);
      if(status === 200) {
        schedules.reloadSchedules();
      }
    });
  });
  
  router.delete('/schedules/:id', function(req, res) {
    GLOBAL.mysqlGlobal.deleteSchedule(req.params.id, function(status, response) {
      res.status(status).json(response);
      if(status === 200) {
        schedules.reloadSchedules();
      }
    });
  });
  
  //cameras  
  router.post('/cameras', function(req, res) {
    GLOBAL.mysqlGlobal.createCamera(req.body, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.get('/cameras', function(req, res) {
    GLOBAL.mysqlGlobal.getCameras(function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.get('/cameras/:id', function(req, res) {
    GLOBAL.mysqlGlobal.getCamera(req.params.id, function(status, response) {
      res.status(status).json(response);
    });
  });

  router.put('/cameras/:id', function(req, res) {
    GLOBAL.mysqlGlobal.updateCamera(req.params.id, req.body, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.delete('/cameras/:id', function(req, res) {
    GLOBAL.mysqlGlobal.deleteCamera(req.params.id, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  //scenes  
  router.post('/scenes', function(req, res) {
    GLOBAL.mysqlGlobal.createScene(req.body, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.get('/scenes', function(req, res) {
    GLOBAL.mysqlGlobal.getScenes(function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.get('/scenes/:id', function(req, res) {
    GLOBAL.mysqlGlobal.getScene(req.params.id, function(status, response) {
      res.status(status).json(response);
    });
  });

  router.put('/scenes/:id', function(req, res) {
    GLOBAL.mysqlGlobal.updateScene(req.params.id, req.body, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.delete('/scenes/:id', function(req, res) {
    GLOBAL.mysqlGlobal.deleteScene(req.params.id, function(status, response) {
      res.status(status).json(response);
      if(status === 200) {
        schedules.reloadSchedules();
      }
    });
  });
  
  //alarm
  router.get('/alarm', function(req, res) {
    GLOBAL.mysqlGlobal.getAlarm(function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.put('/alarm', function(req, res) {
    GLOBAL.mysqlGlobal.updateAlarm(req.body, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  //users
  router.post('/users', function(req, res) {
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) {
      if(user.role < 1) {
        sequelize.models.users.create({
          username: "paul@pauljdehmer.com",
          email: "paul@pauljdehmer.com",
          password: "password",
          role: 0
        }).then(function(users) {
          res.status(200).json({
            status: 'success',
            data: users
          });
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'not authorized'
        });
      }
    });
  });
  
  router.get('/users', function(req, res) {    
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) {
      if(user.role < 1) {
        sequelize.models.users.findAll({
          attributes: {
            exclude: ['password']
          }
        }).then(function(users) {
          res.status(200).json({
            status: 'success',
            data: users
          });
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'not authorized'
        });
      }
    });
  });
  
  router.get('/users/:username', function(req, res) {
    GLOBAL.mysqlGlobal.getUser(req.headers.username, function(status, response) {
      if((response.data.role < 1) || (req.headers.username === req.params.username)) {
        GLOBAL.mysqlGlobal.getUser(req.params.username, function(status, response) {
          res.status(status).json(response);
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'you do not have permission to perform this action'
        })
      }
    });
  });
  
  router.post('/users/forgotpassword', function(req, res) {
    GLOBAL.mysqlGlobal.forgotPassword(req.body.email, function(status, response) {
      res.status(status).json(response);
    });
  });
  
  router.post('/users/forgotpassword/changepassword', function(req, res) {
    GLOBAL.mysqlGlobal.getUser(req.body.username, function(status, response) {
      if(response.data.forgotpasswordkey === req.body.forgotpasswordkey) {
        GLOBAL.mysqlGlobal.changePassword(req.params.username, req.body.password, function(status, response) {
          res.status(status).json(response);
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'you do not have permission to perform this action'
        })
      }
    });
  });
  
  router.put('/users/:username/changeusername', function(req, res) {
    GLOBAL.mysqlGlobal.getUser(req.headers.username, function(status, response) {
      if(req.headers.username === req.params.username) {
        GLOBAL.mysqlGlobal.changeUsername(req.headers.username, req.body.username, function(status, response) {
          res.status(status).json(response);
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'you do not have permission to perform this action'
        })
      }
    });
  });
  
  router.put('/users/:username/changeemail', function(req, res) {
    GLOBAL.mysqlGlobal.getUser(req.headers.username, function(status, response) {
      if(req.headers.username === req.params.username) {
        GLOBAL.mysqlGlobal.changeEmail(req.headers.username, req.body.email, function(status, response) {
          res.status(status).json(response);
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'you do not have permission to perform this action'
        })
      }
    });
  });
  
  router.put('/users/:username/changepassword', function(req, res) {
    GLOBAL.mysqlGlobal.getUser(req.headers.username, function(status, response) {
      if((response.data.role < 1) || (req.headers.username === req.params.username) || (response.data.forgotpasswordkey === req.body.forgotpasswordkey)) {
        GLOBAL.mysqlGlobal.changePassword(req.params.username, req.body.password, function(status, response) {
          res.status(status).json(response);
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'you do not have permission to perform this action'
        })
      }
    });
  });
  
  router.put('/users/:username/changerole', function(req, res) {
    GLOBAL.mysqlGlobal.getUser(req.headers.username, function(status, response) {
      if((response.data.role < 1)) {
        GLOBAL.mysqlGlobal.changeRole(req.params.username, req.body.role, function(status, response) {
          res.status(status).json(response);
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'you do not have permission to perform this action'
        })
      }
    });
  });
  
  router.delete('/users/:username', function(req, res) {
    GLOBAL.mysqlGlobal.getUser(req.headers.username, function(status, response) {
      if(response.data.role < 1) {
        GLOBAL.mysqlGlobal.deleteUser(req.params.username, function(status, response) {
          res.status(status).json(response);
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'you do not have permission to perform this action'
        })
      }
    });
  });
  
  
  //setting up app---------------------------------------  
  app.use(authenticate);
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  app.use(cors());
  app.use(router);
  app.use(function (error, req, res, next) {
    if (error instanceof SyntaxError) {
      var status = 400;
      var response = {
        'status': 'error',
        'data': 'syntax error'
      }
      res.status(status).json(response);
    } else {
      next();
    }
  });
  
  function initialize() {
    if(!serversStarted) {
      serversStarted = true;
      app.listen(3000);
      console.log('Application Started');
    }
  }
  
  return {
    initialize: initialize
  }
}