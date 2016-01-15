module.exports = function(sequelize, socket) {
  var zwave;
  var sceneActions = [];
  var callback;
  var actionsRun;
  var actionError;
  
  function runScene(id, callbackParam) {
    console.log('running scene '+id);
    callback = callbackParam;
    sequelize.models.scenes.findAll({
      where: {
        id: id
      },
      include: [
        {
          model: sequelize.models.sceneActions,
          as: 'actions',
          required: false
        }
      ]
    }).then(function(scene) {
      if(scene.length !== 0) {
        sceneActions = scene[0].actions;
        if(sceneActions.length !== 0) {
          if(scene[0].dataValues.change_alarm) {
            sequelize.models.alarm.update(
              {
                armed: scene[0].dataValues.armed
              },
              {
                where: {
                  id: 1
                }
              }
            ).then(function(affectedArray) {
              socket.updateAlarm(scene[0].dataValues.armed);
              runSceneActions(scene, function(status, message){
                callback(status, {message: message});
              });
            }, function(error) {
              callback(400, {message: 'error running scene'});
            });
          } else {
            runSceneActions(scene, function(status, message){
              callback(status, {message: message});
            });
          }
        } else {
          callback(200, {message: 'scene executed'});
        }
      } else {
        callback(400, {message: 'scene id does not exist'});
      }
    }, function(error) {
      callback(400, {message: 'error running scene'});
    });
  }
  
  function runSceneActions(scene, callback) {
    actionsRun = 0;
    actionError = false;
    var data = [];
    for(var i=0;i<scene[0].actions.length;i++) {
      data = {
        class_id: scene[0].actions[i].dataValues.class_id,
        instance: scene[0].actions[i].dataValues.instance,
        index: scene[0].actions[i].dataValues.index
      }
      if(scene[0].actions[i].dataValues.value === 'true') {
        data.value = true;
      } else if(scene[0].actions[i].dataValues.value === 'false') {
        data.value = false;
      } else {
        data.value = parseInt(scene[0].actions[i].dataValues.value, 10);
      }
      zwave.setValue(scene[0].actions[i].dataValues.node_id, data, function(status, message) {
        if(status === 400) {
          actionError = true;
        }
        sceneActionComplete();
      });
    }
  }
  
  function sceneActionComplete() {
    actionsRun++;
    if(actionsRun === sceneActions.length) {
      if(!actionError) {
        callback(200, {message: 'scene executed'});
      } else {
        callback(400, {message: 'error running scene'});
      }
    }
  }
  
  function injectZwave(zwaveParam) {
    zwave = zwaveParam;
  }
  
  return {
    runScene: runScene,
    injectZwave: injectZwave
  }
}