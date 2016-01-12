module.exports = function(schedulesParam, sequelize, zwave) {
  var config = require('../../config.js')[process.env.NODE_ENV];
  var uuid = require('node-uuid');
  var crypto = require('crypto');
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
  
  //sha256 helper
  function getsha256(message) {
    return crypto.createHash('sha256').update(message+config.database.salt, 'utf8').digest('hex');
  }
  
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
    
    //TODO: remove this line because this skips authentication
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
  
  //proxy
  router.post('/proxy', function(req, res) {
    http.request(req.body.url, function(){
      res.status(200).json({status:'success'});
    }).end();
  });
  
  //alarm
  router.get('/alarm', function(req, res) {
    sequelize.models.alarm.findAll({
      attributes: {
        exclude: ['id']
      }
    }).then(function(alarm) { //sequelize connection success
      res.status(200).json({
        status: 'success',
        data: {
          armed: alarm[0].armed
        }
      });
    }, function(error) { //sequelize connection error
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.put('/alarm', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to change id'
        }
      });
      return;
    }
    
    sequelize.models.alarm.update(
      req.body,
      {
        where: {
          id: 1
        }
      }
    ).then(function(affectedArray) {
      res.status(200).json({
        status: 'success',
        data: {
          affectedCount: affectedArray[0]
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  //cameras
  router.post('/cameras', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to set id'
        }
      });
      return;
    }
    
    sequelize.models.cameras.create(req.body).then(function(camera) {
      res.status(200).json({
        status: 'success',
        data: {
          camera: camera
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.get('/cameras', function(req, res) {
    sequelize.models.cameras.findAll({}).then(function(cameras) { //sequelize connection success
      res.status(200).json({
        status: 'success',
        data: cameras
      });
    }, function(error) { //sequelize connection error
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.get('/cameras/:id', function(req, res) {
    sequelize.models.cameras.findAll({
      where: {
        id: req.params.id
      }
    }).then(function(camera) {
      res.status(200).json({
        status: 'success',
        data: {
          camera: camera
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.put('/cameras/:id', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to change id'
        }
      });
      return;
    }
    
    sequelize.models.cameras.update(
      req.body,
      {
        where: {
          id: req.params.id
        }
      }
    ).then(function(affectedArray) {
      res.status(200).json({
        status: 'success',
        data: {
          affectedCount: affectedArray[0]
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.delete('/cameras/:id', function(req, res) {
    sequelize.models.cameras.destroy({
      where: {
        id: req.params.id,
      }
    }).then(function(destroyedRows) {
      res.status(200).json({
        status: 'success',
        data: {
          destroyedRows: destroyedRows
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  //controller
  router.get('/controller/reset', function(req, res) {
    zwave.controllerReset(function(status, message) {
      res.status(status).json({
        status: status === 200 ? 'success' : 'error',
        data:  message
      });
    });
  });
  
  //login
  router.post('/login', bruteforce.prevent, function(req, res) {
    if((typeof req.body.username === 'undefined') || (typeof req.body.password === 'undefined')){
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'please provide all credentials'
        }
      });
      return;
    }
    
    var password = getsha256(req.body.password);
    
    sequelize.models.users.findOne({
      where: {
        username: req.body.username,
        password: password
      },
      attributes: {
        exclude: ['password', 'forgotpasswordkey']
      }
    }).then(function(user) { //sequelize connection success
      if(user) {
        res.status(200).json({
          status: 'success',
          data: {
            user: user
          }
        });
      } else {
        res.status(400).json({
          status: 'error',
          data: {
            message: 'incorrect credentials'
          }
        });
      }
    }, function(error) { //sequelize connection error
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });

  //nodes
  router.get('/nodes', function(req, res) {
    sequelize.models.nodes.findAll({
      order: [['node_id', 'ASC']],
      include: [
        {
          model: sequelize.models.nodesAlarms,
          as: 'alarms',
          required: false,
          attributes: {
            exclude: ['NodeNodeId']
          }
        },
        {
          model: sequelize.models.nodesScenes,
          as: 'scenes',
          required: false,
          attributes: {
            exclude: ['NodeNodeId']
          }
        }
      ],
      attributes: {
        exclude: ['id']
      }
    }).then(function(nodes) { //sequelize connection success
      for(var i=0;i<nodes.length;i++) {
        nodes[i].dataValues.zwave_data = zwave.nodes[nodes[i].dataValues.node_id];
        delete nodes[i].dataValues.zwave_data.name;
        delete nodes[i].dataValues.zwave_data.loc;
      }
      res.status(200).json({
        status: 'success',
        data: {
          nodes: nodes
        }
      });
    }, function(error) { //sequelize connection error
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.get('/nodes/:nodeid', function(req, res) {
    sequelize.models.nodes.findAll({
      where: {
        node_id: req.params.nodeid
      },
      include: [
        {
          model: sequelize.models.nodesAlarms,
          as: 'alarms',
          required: false,
          attributes: {
            exclude: ['NodeNodeId']
          }
        },
        {
          model: sequelize.models.nodesScenes,
          as: 'scenes',
          required: false,
          attributes: {
            exclude: ['NodeNodeId']
          }
        }
      ],
      attributes: {
        exclude: ['id']
      }
    }).then(function(node) {
      node[0].dataValues.zwave_data = zwave.nodes[node[0].dataValues.node_id];
      delete node[0].dataValues.zwave_data.name;
      delete node[0].dataValues.zwave_data.loc;
      res.status(200).json({
        status: 'success',
        data: {
          node: node
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.put('/nodes/:nodeid', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to change id'
        }
      });
      return;
    }
    
    if(typeof req.body.node_id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to change node id'
        }
      });
      return;
    }
    
    sequelize.models.nodes.update(
      req.body,
      {
        where: {
          node_id: req.params.nodeid
        }
      }
    ).then(function(affectedArray) {
      res.status(200).json({
        status: 'success',
        data: {
          affectedCount: affectedArray[0]
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.post('/nodes/:nodeid/alarms', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to set id'
        }
      });
      return;
    }
    
    req.body.NodeNodeId = req.params.nodeid;
    
    sequelize.models.nodesAlarms.create(req.body).then(function(alarm) {
      res.status(200).json({
        status: 'success',
        data: {
          alarm: alarm
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.put('/nodes/alarms/:id', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to change id'
        }
      });
      return;
    }
    
    sequelize.models.nodesAlarms.update(
      req.body,
      {
        where: {
          id: req.params.id
        }
      }
    ).then(function(affectedArray) {
      res.status(200).json({
        status: 'success',
        data: {
          affectedCount: affectedArray[0]
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.delete('/nodes/alarms/:id', function(req, res) {
    sequelize.models.nodesAlarms.destroy({
      where: {
        id: req.params.id,
      }
    }).then(function(destroyedRows) {
      res.status(200).json({
        status: 'success',
        data: {
          destroyedRows: destroyedRows
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.post('/nodes/:nodeid/scenes', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to set id'
        }
      });
      return;
    }
    
    req.body.NodeNodeId = req.params.nodeid;
    
    sequelize.models.nodesScenes.create(req.body).then(function(scene) {
      res.status(200).json({
        status: 'success',
        data: {
          scene: scene
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.put('/nodes/scenes/:id', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to change id'
        }
      });
      return;
    }
    
    sequelize.models.nodesScenes.update(
      req.body,
      {
        where: {
          id: req.params.id
        }
      }
    ).then(function(affectedArray) {
      res.status(200).json({
        status: 'success',
        data: {
          affectedCount: affectedArray[0]
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.delete('/nodes/scenes/:id', function(req, res) {
    sequelize.models.nodesScenes.destroy({
      where: {
        id: req.params.id,
      }
    }).then(function(destroyedRows) {
      res.status(200).json({
        status: 'success',
        data: {
          destroyedRows: destroyedRows
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.put('/nodes/:nodeid/command', function(req, res) {
    zwave.setValue(req.params.nodeid, req.body, function(status, message) {
      res.status(status).json({
        status: status === 200 ? 'success' : 'error',
        data:  message
      });
    });
  });
  
  router.put('/nodes/:nodeid/config', function(req, res) {
    zwave.setConfigParam(req.params.nodeid, req.body, function(status, message) {
      res.status(status).json({
        status: status === 200 ? 'success' : 'error',
        data:  message
      });
    });
  });
  
  router.put('/nodes/:nodeid/polling', function(req, res) {
    zwave.changePolling(req.params.nodeid, req.body, function(status, message) {
      res.status(status).json({
        status: status === 200 ? 'success' : 'error',
        data:  message
      });
    });
  });
  
  //scenes
  router.post('/scenes', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to set id'
        }
      });
      return;
    }
    
    sequelize.models.scenes.create(req.body).then(function(scene) {
      res.status(200).json({
        status: 'success',
        data: {
          scene: scene
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.get('/scenes', function(req, res) {
    sequelize.models.scenes.findAll({}).then(function(scenes) { //sequelize connection success
      res.status(200).json({
        status: 'success',
        data: scenes
      });
    }, function(error) { //sequelize connection error
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.get('/scenes/:id', function(req, res) {
    sequelize.models.scenes.findAll({
      where: {
        id: req.params.id
      }
    }).then(function(scene) {
      res.status(200).json({
        status: 'success',
        data: {
          scene: scene
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.put('/scenes/:id', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to change id'
        }
      });
      return;
    }
    
    sequelize.models.scenes.update(
      req.body,
      {
        where: {
          id: req.params.id
        }
      }
    ).then(function(affectedArray) {
      res.status(200).json({
        status: 'success',
        data: {
          affectedCount: affectedArray[0]
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.delete('/scenes/:id', function(req, res) {
    sequelize.models.scenes.destroy({
      where: {
        id: req.params.id,
      }
    }).then(function(destroyedRows) {
      res.status(200).json({
        status: 'success',
        data: {
          destroyedRows: destroyedRows
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.get('/scenes/:id/run', function(req, res) {
    //TODO: make scene run
    sequelize.models.scenes.findAll({
      where: {
        id: req.params.id
      }
    }).then(function(scene) {
      res.status(200).json({
        status: 'success',
        data: {
          scene: scene
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });

  //users
  router.post('/users', function(req, res) {
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) { //sequelize connection success
      //TODO: delete this
      var user = [];
      user.role = 0;
      
      if(typeof req.body.password !== 'undefined') {
        req.body.password = getsha256(req.body.password);
      }
      
      if(typeof req.body.id !== 'undefined') {
        res.status(400).json({
          status: 'error',
          data: {
            mesage: 'not allowed to set id'
          }
        });
        return;
      }
      
      if(typeof req.body.apikey !== 'undefined') {
        res.status(400).json({
          status: 'error',
          data: {
            mesage: 'not allowed to set apikey'
          }
        });
        return;
      }
      
      if(typeof req.body.forgotpasswordkey !== 'undefined') {
        res.status(400).json({
          status: 'error',
          data: {
            mesage: 'not allowed to set forgotpasswordkey'
          }
        });
        return;
      }
      
      if(user.role === 0) {
        sequelize.models.users.create(req.body).then(function(user) {
          res.status(200).json({
            status: 'success',
            data: {
              user: user
            }
          });
        }, function(error) {
          res.status(400).json({
            status: 'error',
            data: error
          });
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'not authorized'
        });
      }
    }, function(error) { //sequelize connection error
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.get('/users', function(req, res) {    
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) { //sequelize connection success
      //TODO: delete this
      var user = [];
      user.role = 0;
      if(user.role === 0) {
        sequelize.models.users.findAll({
          attributes: {
            exclude: ['password', 'forgotpasswordkey']
          }
        }).then(function(users) {
          res.status(200).json({
            status: 'success',
            data: {
              users: users
            }
          });
        }, function(error) {
          res.status(400).json({
            status: 'error',
            data: error
          });
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'not authorized'
        });
      }
    }, function(error) { //sequelize connection error
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.get('/users/:username', function(req, res) {
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) { //sequelize connection success
      //TODO: delete this
      var user = [];
      user.role = 0;
      if((user.role === 0) || (user.username === req.headers.username)){
        sequelize.models.users.findOne({
          where: {
            username: req.params.username
          },
          attributes: {
            exclude: ['password', 'forgotpasswordkey']
          }
        }).then(function(user) {
          res.status(200).json({
            status: 'success',
            data: {
              user: user
            }
          });
        }, function(error) {
          res.status(400).json({
            status: 'error',
            data: error
          });
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'not authorized'
        });
      }
    }, function(error) { //sequelize connection error
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.put('/users/:username', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to change id'
        }
      });
      return;
    }
    
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) { //sequelize connection success
      //TODO: delete this
      var user = [];
      user.role = 0;
      
      if(typeof req.body.password !== 'undefined') {
        req.body.password = getsha256(req.body.password);
      }
      
      if(typeof req.body.id !== 'undefined') {
        res.status(400).json({
          status: 'error',
          data: {
            mesage: 'not allowed to change id'
          }
        });
        return;
      }
      
      if(typeof req.body.apikey !== 'undefined') {
        res.status(400).json({
          status: 'error',
          data: {
            mesage: 'not allowed to change apikey'
          }
        });
        return;
      }
      
      if((user.role !== 0) && (typeof req.body.role !== 'undefined')){
        res.status(400).json({
          status: 'error',
          data: {
            mesage: 'not allowed to change role'
          }
        });
        return;
      }
      
      if(typeof req.body.forgotpasswordkey !== 'undefined') {
        res.status(400).json({
          status: 'error',
          data: {
            mesage: 'not allowed to change forgotpasswordkey'
          }
        });
        return;
      }
      
      if((user.role === 0) || (user.username === req.headers.username)){
        sequelize.models.users.update(
          req.body,
          {
            where: {
              username: req.params.username
            }
          }
        ).then(function(affectedArray) {
          res.status(200).json({
            status: 'success',
            data: {
              affectedCount: affectedArray[0]
            }
          });
        }, function(error) {
          res.status(400).json({
            status: 'error',
            data: error
          });
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'not authorized'
        });
      }
    }, function(error) { //sequelize connection error
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.delete('/users/:username', function(req, res) {    
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) { //sequelize connection success
      //TODO: delete this
      var user = [];
      user.role = 0;
      if(user.role === 0) {
        sequelize.models.users.destroy({
          where: {
            username: req.params.username,
          }
        }).then(function(destroyedRows) {
          res.status(200).json({
            status: 'success',
            data: {
              destroyedRows: destroyedRows
            }
          });
        }, function(error) {
          res.status(400).json({
            status: 'error',
            data: error
          });
        });
      } else {
        res.status(403).json({
          status: 'error',
          data: 'not authorized'
        });
      }
    }, function(error) { //sequelize connection error
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.get('/users/:email/forgotpassword', function(req, res) {
    sequelize.models.users.update(
      {
        forgotpasswordkey: uuid.v4()
      },
      {
        where: {
          email: req.params.email
        }
      }
    ).then(function() { //sequelize connection success
      //TODO: send email
      res.status(200).json({
        status: 'success',
        data: {
          message: 'check your email for instructions on how to change your password'
        }
      });
    }, function() { //sequlize connection error
      res.status(200).json({
        status: 'success',
        data: {
          message: 'check your email for instructions on how to change your password'
        }
      });
  });
    });
  
  router.post('/users/:email/forgotpassword', function(req, res) {
    if(req.body.forgotpasswordkey === null) {
      res.status(400).json({
        status: 'error',
        data: {
          message: 'there was an error updating your password'
        }
      });
      return;
    }
    
    sequelize.models.users.update(
      {
        password: getsha256(req.body.password),
        forgotpasswordkey: null
      },
      {
        where: {
          email: req.params.email,
          forgotpasswordkey: req.body.forgotpasswordkey
        }
      }
    ).then(function(affectedArray) { //sequelize connection success
      if(affectedArray[0] === 1) {
        res.status(200).json({
          status: 'success',
          data: {
            message: 'your password has been updated'
          }
        });
      } else {
        res.status(400).json({
          status: 'error',
          data: {
            message: 'there was an error updating your password'
          }
        });
      }
    }, function(error) { //sequelize connection error
      res.status(400).json({
        status: 'error',
        data: {
          message: 'there was an error updating your password'
        }
      });
    });
  });
  
  //setting up app  
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

/*TODO:
- nodes alarm endpoints
- nodes scenes endpoints
- scenes-action endpoints
- schedules/schedule-scenes endpoints
- delete schedule containing a scene and reload schedules when deleting a scene
*/