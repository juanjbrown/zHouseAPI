module.exports = function(aws, socket, schedules, scenes, sequelize, zwave) {
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
    
    if(req.path === '/users/activate') {
      return next();
    }
    
    if(req.path === '/users/forgot-password') {
      return next();
    }
    
    if(req.path === '/users/forgot-password/change-password') {
      return next();
    }
    
    if(req.path === '/users/admin-password-changed') {
      return next();
    }
    
    if(req.method === 'OPTIONS') {
      return next();
    }
    
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
  
  router.get('/auth', function(req, res) {
    res.status(200).json({
      status: 'success',
      data: {
        authed: true
      }
    });
  });
  
  //proxy
  router.post('/proxy', function(req, res) {
    var req = http.request(req.body.url, function(){
      res.status(200).json({status:'success'});
    })
    
    req.on('error', function(e) {
      res.status(200).json({status:'success'});
    });
    
    req.end();
  });
  
  //alarm
  router.get('/alarm', function(req, res) {
    sequelize.models.alarm.findAll({
      attributes: {
        exclude: ['id']
      }
    }).then(function(alarm) {
      res.status(200).json({
        status: 'success',
        data: {
          armed: alarm[0].armed
        }
      });
    }, function(error) {
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
      if(!req.body.armed) {
        zwave.cancelSiren(false);
      }
      socket.updateAlarm(req.body.armed);
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
    sequelize.models.cameras.findAll({}).then(function(cameras) {
      res.status(200).json({
        status: 'success',
        data: cameras
      });
    }, function(error) {
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
    }).then(function(user) {
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
    }, function(error) {
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
          model: sequelize.models.nodeAlarmTriggers,
          as: 'alarm_triggers',
          required: false
        },
        {
          model: sequelize.models.nodeSceneTriggers,
          as: 'scene_triggers',
          required: false,
          include: [
            {
              model: sequelize.models.nodeSceneTriggerScenes,
              as: 'scenes',
              required: false,
              attributes: {
                exclude: ['id', 'scene_trigger_id']
              }
            }
          ]
        },
        {
          model: sequelize.models.nodeSceneMaps,
          as: 'scene_maps',
          required: false,
          attributes: {
            exclude: ['id', 'node_id']
          }
        },
        {
          model: sequelize.models.nodeCategories,
          as: 'categories',
          required: false,
          attributes: {
            exclude: ['id', 'node_id']
          }
        }
      ]
    }).then(function(nodes) {
      for(var i=0;i<nodes.length;i++) {
        nodes[i].dataValues.zwave_data = zwave.nodes[nodes[i].dataValues.node_id];
        if (typeof nodes[i].dataValues.zwave_data !== 'undefined') {
          delete nodes[i].dataValues.zwave_data.name;
          delete nodes[i].dataValues.zwave_data.loc;
        }
      }
      res.status(200).json({
        status: 'success',
        data: {
          nodes: nodes
        }
      });
    }, function(error) {
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
          model: sequelize.models.nodeAlarmTriggers,
          as: 'alarm_triggers',
          required: false
        },
        {
          model: sequelize.models.nodeSceneTriggers,
          as: 'scene_triggers',
          required: false,
          include: [
            {
              model: sequelize.models.nodeSceneTriggerScenes,
              as: 'scenes',
              required: false,
              attributes: {
                exclude: ['id', 'scene_trigger_id']
              }
            }
          ]
        },
        {
          model: sequelize.models.nodeSceneMaps,
          as: 'scene_maps',
          required: false,
          attributes: {
            exclude: ['id', 'node_id']
          }
        },
        {
          model: sequelize.models.nodeCategories,
          as: 'categories',
          required: false,
          attributes: {
            exclude: ['id', 'node_id']
          }
        }
      ]
    }).then(function(node) {
      if(node.length === 0) {
        res.status(400).json({
          status: 'error',
          data: {
            message: 'node id does not exist'
          }
        });
      } else {
        node[0].dataValues.zwave_data = zwave.nodes[node[0].dataValues.node_id];
        delete node[0].dataValues.zwave_data.name;
        delete node[0].dataValues.zwave_data.loc;
        res.status(200).json({
          status: 'success',
          data: {
            node: node
          }
        });
      }
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
  
  router.post('/nodes/:nodeid/alarm-triggers', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to set id'
        }
      });
      return;
    }
    
    req.body.node_id = req.params.nodeid;
    
    sequelize.models.nodeAlarmTriggers.create(req.body).then(function(alarm) {
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
  
  router.put('/nodes/alarm-triggers/:id', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to change id'
        }
      });
      return;
    }
    
    sequelize.models.nodeAlarmTriggers.update(
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
  
  router.delete('/nodes/alarm-triggers/:id', function(req, res) {
    sequelize.models.nodeAlarmTriggers.destroy({
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
  
  router.post('/nodes/:nodeid/scene-triggers', function(req, res) {
    var createError = false;
    var errorData = [];
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to set id'
        }
      });
      return;
    }
    
    req.body.node_id = req.params.nodeid;

    sequelize.models.nodeSceneTriggers.create(req.body).then(function(scene) {
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
  
  router.put('/nodes/scene-triggers/:id', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to change id'
        }
      });
      return;
    }
    
    sequelize.models.nodeSceneTriggers.update(
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
  
  router.delete('/nodes/scene-triggers/:id', function(req, res) {
    sequelize.models.nodeSceneTriggers.destroy({
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
  
  router.post('/nodes/scene-triggers/:id/add-scene', function(req, res) {
    sequelize.models.nodeSceneTriggerScenes.create({
      scene_trigger_id: parseInt(req.params.id, 10),
      scene_id: req.body.scene_id
    }).then(function(scene){
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
  
  router.delete('/nodes/scene-triggers/:id/delete-scene', function(req, res) {
    sequelize.models.nodesSceneTriggerScenes.destroy({
      where: {
        scene_trigger_id: parseInt(req.params.id, 10),
        scene_id: req.body.scene_id
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
  
  router.post('/nodes/scene-maps/:id/add-scene-map', function(req, res) {
    sequelize.models.nodeSceneMaps.create({
      node_id: parseInt(req.params.id, 10),
      transmitted_scene_id: req.body.transmitted_scene_id,
      scene_id: req.body.scene_id
    }).then(function(sceneMap){
      res.status(200).json({
        status: 'success',
        data: {
          scene_map: sceneMap
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.delete('/nodes/scene-maps/:id/delete-scene-map', function(req, res) {
    sequelize.models.nodeSceneMaps.destroy({
      where: {
        node_id: parseInt(req.params.id, 10),
        transmitted_scene_id: req.body.transmitted_scene_id,
        scene_id: req.body.scene_id
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
  
  router.get('/nodes/:nodeid/remove-failed', function(req, res) {
    zwave.removeFailedNode(req.params.nodeid, function(status, message) {
      if(status === 200) {
        sequelize.models.nodes.destroy({
          where: {
            node_id: req.params.node_id,
          }
        });
      }
      res.status(status).json({
        status: status === 200 ? 'success' : 'error',
        data:  message
      });
    });
  });
  
  router.get('/nodes/:nodeid/has-node-failed', function(req, res) {
    zwave.hasNodeFailed(req.params.nodeid, function(status, message) {
      res.status(status).json({
        status: status === 200 ? 'success' : 'error',
        data:  message
      });
    });
  });
  
  router.get('/nodes/:nodeid/replace-failed', function(req, res) {
    zwave.replaceFailedNode(req.params.nodeid, function(status, message) {
      res.status(status).json({
        status: status === 200 ? 'success' : 'error',
        data:  message
      });
    });
  });
  
  router.get('/nodes/:nodeid/heal-node', function(req, res) {
    zwave.healNetworkNode(req.params.nodeid, function(status, message) {
      res.status(status).json({
        status: status === 200 ? 'success' : 'error',
        data:  message
      });
    });
  });
  
  //network
  router.get('/network/heal-network', function(req, res) {
    zwave.replaceFailedNode(function(status, message) {
      res.status(status).json({
        status: status === 200 ? 'success' : 'error',
        data:  message
      });
    });
  });
  
  //scenes
  router.post('/scenes', function(req, res) {  
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
    sequelize.models.scenes.findAll({
      order: [['id', 'ASC']],
      include: [
        {
          model: sequelize.models.sceneActions,
          as: 'actions',
          required: false
        }
      ]
    }).then(function(scenes) {
      res.status(200).json({
        status: 'success',
        data: scenes
      });
    }, function(error) {
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
      },
      include: [
        {
          model: sequelize.models.sceneActions,
          as: 'actions',
          required: false
        }
      ]
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
    scenes.runScene(req.params.id, function(status, message) {
      res.status(status).json({
        status: status === 200 ? 'success' : 'error',
        data:  message
      });
    });
  });
  
  router.post('/scenes/:id/scene-actions', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to set id'
        }
      });
      return;
    }
    
    req.body.scene_id = req.params.id;
    
    sequelize.models.sceneActions.create(req.body).then(function(action) {
      res.status(200).json({
        status: 'success',
        data: {
          actions: action
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.put('/scenes/scene-actions/:id', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to change id'
        }
      });
      return;
    }
    
    sequelize.models.sceneActions.update(
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
  
  router.delete('/scenes/scene-actions/:id', function(req, res) {
    sequelize.models.sceneActions.destroy({
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
  
  //schedules
  router.post('/schedules', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to set id'
        }
      });
      return;
    }
    
    sequelize.models.schedules.create(req.body).then(function(schedule) {
      schedules.createJob(schedule.dataValues.id, schedule.dataValues.cron);
      res.status(200).json({
        status: 'success',
        data: {
          scene: schedule
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.get('/schedules', function(req, res) {
    sequelize.models.schedules.findAll({
      order: [['id', 'ASC']],
      include: [
        {
          model: sequelize.models.scheduleScenes,
          as: 'scenes',
          required: false,
          attributes: {
            exclude: ['id', 'schedule_id']
          }
        }
      ]
    }).then(function(schedules) {
      res.status(200).json({
        status: 'success',
        data: schedules
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.get('/schedules/:id', function(req, res) {
    sequelize.models.schedules.findAll({
      where: {
        id: req.params.id
      },
      include: [
        {
          model: sequelize.models.scheduleScenes,
          as: 'scenes',
          required: false,
          attributes: {
            exclude: ['id', 'schedule_id']
          }
        }
      ]
    }).then(function(schedule) {
      res.status(200).json({
        status: 'success',
        data: {
          schedule: schedule
        }
      });
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.put('/schedules/:id', function(req, res) {
    if(typeof req.body.id !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to change id'
        }
      });
      return;
    }
    
    sequelize.models.schedules.update(
      req.body,
      {
        where: {
          id: req.params.id
        }
      }
    ).then(function(affectedArray) {
      if(typeof req.body.cron !== 'undefined') {
        if(affectedArray[0] === 1) {
          schedules.deleteJob(req.params.id);
          schedules.createJob(req.params.id, req.body.cron);
        }
      }
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
  
  router.delete('/schedules/:id', function(req, res) {
    sequelize.models.schedules.destroy({
      where: {
        id: req.params.id,
      }
    }).then(function(destroyedRows) {
      if(destroyedRows === 1) {
        schedules.deleteJob(req.params.id);
      }
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
  
  router.post('/schedules/:id/add-scene', function(req, res) {    
    sequelize.models.scheduleScenes.create({
      schedule_id: parseInt(req.params.id, 10),
      scene_id: req.body.scene_id
    }).then(function(scene){
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
  
  router.delete('/schedules/:id/delete-scene', function(req, res) {
    sequelize.models.scheduleScenes.destroy({
      where: {
        schedule_id: parseInt(req.params.id, 10),
        scene_id: req.body.scene_id
      }
    }).then(function(destroyedRows) {
      if(destroyedRows === 1) {
        schedules.deleteJob(parseInt(req.params.id, 10));
      }
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
  
  //users
  router.get('/users/admin-password-changed', function(req, res) {
    sequelize.models.users.findOne({
      where: {
        username: 'admin',
        apikey: '73e40425-33f6-400d-82c4-a39c4f65ae98'
      }
    }).then(function(user) {
      if(user) {
        res.status(200).json({
          status: 'success',
          data: {
            password_has_changed: false
          }
        });
      } else {
        res.status(200).json({
          status: 'success',
          data: {
            password_has_changed: true
          }
        });
      }
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.post('/users', function(req, res) {
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) {      
      if(typeof req.body.id !== 'undefined') {
        res.status(400).json({
          status: 'error',
          data: {
            mesage: 'not allowed to set id'
          }
        });
        return;
      }
      
      if(typeof req.body.password !== 'undefined') {
        res.status(400).json({
          status: 'error',
          data: {
            mesage: 'not allowed to set password'
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
        req.body.password = getsha256(uuid.v4());
        req.body.forgotpaswordkey = uuid.v4();
        console.log(req.body);
        sequelize.models.users.create(req.body).then(function(user) {
          var emailParams = {
            toAddress: user.email,
            subject: 'zHouse Activate Account',
            ptMessage: user.email+',\n\nPlease visit:\n\n\n'+config.frontend.url+'/activate-account/'+user.forgotpasswordkey+'/?email='+user.email+'\n\n\nto activate your account.',
            htmlMessage: user.email+',<br><br>Please visit:<br><br><a href="'+config.frontend.url+'/activate-account/'+user.forgotpasswordkey+'/?email='+user.email+'">'+config.frontend.url+'/activate-account/'+user.forgotpasswordkey+'/?email='+user.email+'</a><br><br>to activate your account.'
          }
          aws.sendEmail(emailParams, function() {
            res.status(200).json({
              status: 'success',
              data: {
                message: 'user created. a registration email will be sent to the email provided.'
              }
            });
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
    }, function(error) {
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
    }).then(function(user) {
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
    }, function(error) {
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
    }).then(function(user) {
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
    }, function(error) {
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
    
    if(typeof req.body.apikey !== 'undefined') {
      res.status(400).json({
        status: 'error',
        data: {
          mesage: 'not allowed to change apikey'
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
    
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) {
      if(typeof req.body.password !== 'undefined') {
        req.body.password = getsha256(req.body.password);
        req.body.apikey = uuid.v4();
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
      
      if((user.role === 0) || (user.username === req.headers.username)){
        sequelize.models.users.update(
          req.body,
          {
            where: {
              username: req.params.username
            }
          }
        ).then(function(affectedArray) {
          if(typeof req.body.password !== 'undefined') {
            res.status(200).json({
              status: 'success',
              data: {
                affectedCount: affectedArray[0],
                apikey: req.body.apikey
              }
            });
          } else {
            res.status(200).json({
              status: 'success',
              data: {
                affectedCount: affectedArray[0]
              }
            });
          }
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
    }, function(error) {
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
    }).then(function(user) {
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
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: error
      });
    });
  });
  
  router.post('/users/forgot-password', function(req, res) {
    var key = uuid.v4();
    sequelize.models.users.update(
      {
        forgotpasswordkey: key
      },
      {
        where: {
          email: req.body.email
        }
      }
    ).then(function() {
      var emailParams = {
        toAddress: req.body.email,
        subject: 'zHouse Forgot Password',
        ptMessage: req.body.email+',\n\nPlease visit:\n\n\n'+config.frontend.url+'/forgot-password/'+key+'/?email='+req.body.email+'\n\n\nto create a new password.',
        htmlMessage: req.body.email+',<br><br>Please visit:<br><br><a href="'+config.frontend.url+'/forgot-password/'+key+'/?email='+req.body.email+'">'+config.frontend.url+'/forgot-password/'+key+'/?email='+req.body.email+'</a><br><br>to create a new password.'
      }
      aws.sendEmail(emailParams, function() {
        res.status(200).json({
          status: 'success',
          data: {
            message: 'check your email for instructions on how to change your password'
          }
        });
      });
    }, function() {
      res.status(200).json({
        status: 'success',
        data: {
          message: 'check your email for instructions on how to change your password'
        }
      });
    });
  });
  
  router.post('/users/forgot-password/change-password', function(req, res) {
    if(req.body.forgotpasswordkey === null) {
      res.status(400).json({
        status: 'error',
        data: {
          message: 'there was an error updating your password'
        }
      });
      return;
    }
    
    var apikey = uuid.v4();
    
    sequelize.models.users.update(
      {
        password: getsha256(req.body.password),
        forgotpasswordkey: null,
        apikey: apikey
      },
      {
        where: {
          email: req.body.email,
          forgotpasswordkey: req.body.forgotpasswordkey
        }
      }
    ).then(function(affectedArray) {
      if(affectedArray[0] === 1) {
        res.status(200).json({
          status: 'success',
          data: {
            message: 'your password has been updated',
            apikey: apikey
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
    }, function(error) {
      res.status(400).json({
        status: 'error',
        data: {
          message: 'there was an error updating your password'
        }
      });
    });
  });
  
  router.post('/users/activate', function(req, res) {
    if(req.body.activatekey === null) {
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
          email: req.body.email,
          forgotpasswordkey: req.body.activatekey
        }
      }
    ).then(function(affectedArray) {
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
    }, function(error) {
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
    initialize: initialize,
    getsha256: getsha256
  }
}