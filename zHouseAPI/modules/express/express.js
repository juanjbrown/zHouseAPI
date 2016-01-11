module.exports = function(schedulesParam, sequelize) {
  var config = require('../../config.js')[process.env.NODE_ENV];
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
      include: [{
        model: sequelize.models.nodesAlarm,
        as: 'alarm',
        required: false
      }],
      attributes: {
        exclude: ['id']
      }
    }).then(function(nodes) {
      res.status(200).json({
        status: 'success',
        data: {
          nodes: nodes
        }
      });
    });
  });
  
  router.get('/nodes/:nodeid', function(req, res) {
    sequelize.models.nodes.findAll({
      where: {
        node_id: req.params.nodeid
      },
      include: [{
        model: sequelize.models.nodesAlarm,
        as: 'alarm',
        required: false
      }],
      attributes: {
        exclude: ['id']
      }
    }).then(function(node) {
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

  //users
  router.post('/users', function(req, res) {
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) {
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
    });
  });
  
  router.get('/users', function(req, res) {    
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) {
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
    });
  });
  
  router.get('/users/:username', function(req, res) {
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) {
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
    });
  });
  
  router.put('/users/:username', function(req, res) {
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) {
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
    });
  });
  
  router.delete('/users/:username', function(req, res) {    
    sequelize.models.users.findOne({
      where: {
        username: req.headers.username,
        apikey: req.headers.apikey
      }
    }).then(function(user) {
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
    });
  });
  
  router.get('/users/:email/forgotpassword', function(req, res) {
    //TODO
  });
  
  router.post('/users/:email/forgotpassword', function(req, res) {
    //TODO
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
- make sure i have error states on the mysql connection not just the queries
*/