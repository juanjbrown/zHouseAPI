module.exports = function(sequelize) {
  var zwave;
  
  function runScene(id, callback) {
    sequelize.models.scenes.findAll({
      where: {
        id: id
      },
      include: [
        {
          model: sequelize.models.scenesActions,
          as: 'actions',
          required: false
        }
      ]
    }).then(function(scene) {
      //check if scene actually exists by return length
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
    }, function(error) {
      callback(400, {message: 'error running scene'});
    });
  }
  
  function runSceneActions(scene, callback) {
    var data = [];
    for(var i=0;i<scene[0].actions.length;i++) {
      data = {
        class_id: scene[0].actions[0].dataValues.class_id,
        instance: scene[0].actions[0].dataValues.instance,
        index: scene[0].actions[0].dataValues.index,
        value: scene[0].actions[0].dataValues.value,
      }
      zwave.setValue(scene[0].actions[0].dataValues.node_id, data, function(status, message) {
        console.log('')
      });
    }
    callback(200, {message: 'scene executed'});
  }
  
  function injectZwave(zwaveParam) {
    zwave = zwaveParam;
  }
  
  return {
    runScene: runScene,
    injectZwave: injectZwave
  }
}