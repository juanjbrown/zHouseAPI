module.exports = function() {
  function runScene(id) {
    GLOBAL.mysqlGlobal.getScene(id, function(status, response){
      if(typeof response.data.scenes_actions !== 'undefined') {
        for(var i=0;i<response.data.scenes_actions.length;i++) {
          if(response.data.scenes_actions[i].changealarm == 1) {
            GLOBAL.mysqlGlobal.updateAlarm({'armed': response.data[i].alarmvalue}, function(status, response) {});
          }
          var data = {
            class_id: response.data.scenes_actions[i].class_id,
            instance: response.data.scenes_actions[i].instance,
            index: response.data.scenes_actions[i].index,
            value: (response.data.scenes_actions[i].value == 'true')
          }
          GLOBAL.zwaveGlobal.setValue(response.data.scenes_actions[i].node_id, data, function(){});
        }
      }
    });
  }
  
  return {
    runScene: runScene
  }
}