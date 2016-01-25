module.exports = function(socket, aws, scenes, sequelize) {
  var childProcess = require('child_process');
  var config = require('../../config.js')[process.env.NODE_ENV];
  var ZWave = require('../../node_modules/openzwave-shared/lib/openzwave-shared.js');
  var os = require('os');
  var zwave = new ZWave({ConsoleOutput: false});
  var nodes = [];
  var zwavedriverpaths = {'darwin': '/dev/cu.usbmodem1411', 'linux': '/dev/ttyUSB0', 'windows': '\\\\.\\COM3'};
  var scanComplete = false;
  var camerasRecording = false;
  var sirenOn = false;

  zwave.on('driver failed', function () {
    zwave.disconnect();
    process.exit();
  });

  zwave.on('node added', function (nodeid) {
    nodes[nodeid] = {manufacturer: '', manufacturerid: '', product: '', producttype: '', productid: '', type: '', name: '', loc: '', classes: {}, ready: false,};
    sequelize.addNode(nodeid);
  });

  zwave.on('value added', function (nodeid, comclass, value) {
    if (!nodes[nodeid]['classes'][comclass]) {
      nodes[nodeid]['classes'][comclass] = {};
    }
    nodes[nodeid]['classes'][comclass][value.index] = value;
    socket.updateNodes(nodes);
  });

  zwave.on('value changed', function (nodeid, comclass, value) {
    if(nodes[nodeid]['classes'][comclass][value.index].value !== value.value) {
      nodes[nodeid]['classes'][comclass][value.index] = value;
      socket.updateNodes(nodes);
      if(scanComplete) {
        checkAlarm(nodeid, comclass, value);
      }
    }
  });

  zwave.on('value removed', function (nodeid, comclass, index) {
    if (nodes[nodeid]['classes'][comclass] && nodes[nodeid]['classes'][comclass][index]) {
      delete nodes[nodeid]['classes'][comclass][index];
    }
    socket.updateNodes(nodes);
  });

  zwave.on('node ready', function (nodeid, nodeinfo) {
    nodes[nodeid]['manufacturer'] = nodeinfo.manufacturer;
    nodes[nodeid]['manufacturerid'] = nodeinfo.manufacturerid;
    nodes[nodeid]['product'] = nodeinfo.product;
    nodes[nodeid]['producttype'] = nodeinfo.producttype;
    nodes[nodeid]['productid'] = nodeinfo.productid;
    nodes[nodeid]['type'] = nodeinfo.type;
    nodes[nodeid]['name'] = nodeinfo.name;
    nodes[nodeid]['loc'] = nodeinfo.loc;
    nodes[nodeid]['ready'] = true;
    socket.updateNodes(nodes);
  });  
  
  zwave.on('scan complete', function () {
    console.log('scan complete');
    scanComplete = true;
  });
  
  zwave.on('notification', function(nodeid, notif, help) {
	console.log('node%d: notification(%d): %s', nodeid, notif, help);
  });
  
  zwave.on('controller command', function(n,rv,st,msg) {
    console.log('controller commmand feedback: %s node==%d, retval=%d, state=%d',msg,n,rv,st);
  });
  
  zwave.on('scene event', function(nodeid, sceneid) {
    console.log('scene event');
    sequelize.models.nodeSceneMaps.findAll({
      where: {
        node_id: nodeid,
        transmitted_scene_id: sceneid
      }
    }).then(function(maps) {
      for(var i=0;i<maps.length;i++) {
        scenes.runScene(maps[i].scene_id, function(status, message){
          console.log(message.message);
        });
      }
    });
  });
  
  zwave.on('node event', function(nodeid, event, valueid) {
    console.log('node event '+nodeid+' '+event);
  });
  
  function connect() {
    zwave.connect(zwavedriverpaths[os.platform()]);
  }

  function disconnect() {
    zwave.disconnect();
  }

  function restart() {
    disconnect();
    zwave = new ZWave({ConsoleOutput: false});
    zwave.connect(zwavedriverpaths[os.platform()]);
  }
  
  function changePolling(nodeid, data, callback) {
    try {
      if(data.enabled == true) {
        zwave.enablePoll(nodeid, data.class_id, 1);
      } else {
        zwave.disablePoll(nodeid, data.class_id);
      }
      zwave.refreshNodeInfo(nodeid);
      callback(200, {message: 'node successfully updated'});
    }
    catch (error) {
      callback(400, {message: String(error)});
    }
  }
  
  function setConfigParam(nodeid, data, callback) {
    try {
      zwave.setConfigParam(nodeid, data.paramid, data.paramvalue);
      zwave.refreshNodeInfo(nodeid);
      callback(200, {message: 'node successfully updated'});
    }
    catch (error) {
      callback(400, {message: String(error)});
    }
  }

  function setValue(nodeid, data, callback) {
    try {
      zwave.setValue({nodeid: nodeid, class_id: data.class_id, instance: data.instance, index: data.index}, data.value);
      callback(200, {message: 'node successfully updated'});
    }
    catch (error) {
      callback(400, {message: String(error)});
    }
  }

  function controllerReset(callback) {
    try {
      zwave.hardReset();
      callback(200, {message: 'controller reset'});
    }
    catch (error) {
      callback(400, {message: String(error)});
    }
  }
  
  function hasNodeFailed(nodeid, callback) {
    try {
      var nodeFailed = zwave.hasNodeFailed(nodeid);
      callback(200, {message: nodeFailed});
    }
    catch (error) {
      callback(400, {message: String(error)});
    }
  }
  
  function removeFailedNode(nodeid, callback) {
    try {
      zwave.removeFailedNode(nodeid);
      callback(200, {message: 'failed node removed'});
    }
    catch (error) {
      callback(400, {message: String(error)});
    }
  }
  
  function replaceFailedNode(nodeid, callback) {
    try {
      zwave.replaceFailedNode(nodeid);
      callback(200, {message: 'failed node replaced'});
    }
    catch (error) {
      callback(400, {message: String(error)});
    }
  }
  
  function healNetworkNode(nodeid, callback) {
    try {
      zwave.healNetworkNode(nodeid, true);
      callback(200, {message: 'node healed'});
    }
    catch (error) {
      callback(400, {message: String(error)});
    }
  }
  
  function healNetwork(callback) {
    try {
      zwave.healNetwork();
      callback(200, {message: 'network healed'});
    }
    catch (error) {
      callback(400, {message: String(error)});
    }
  }
  
  function checkAlarm(nodeid, comclass, value) {
    sequelize.models.alarm.findAll({
      attributes: {
        exclude: ['id']
      }
    }).then(function(alarm) {
      if(alarm[0].dataValues.armed) {
        sequelize.models.nodes.findAll({
          where: {
            node_id: nodeid
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
            }
          ]
        }).then(function(node) {
          for(var i=0;i<node[0].dataValues.alarm_triggers.length;i++) {
            if(node[0].dataValues.alarm_triggers[i].class_id === comclass) {
              if((node[0].dataValues.alarm_triggers[i].value == 'true') === value.value) {
                if(node[0].dataValues.alarm_triggers[i].sms) {
                  console.log('sending alarm sms for '+node[0].dataValues.name);
                  aws.sendSMS(node[0].dataValues.name+' alarm!');
                }

                if(node[0].dataValues.alarm_triggers[i].siren) {
                  console.log('sounding siren for '+node[0].dataValues.name);
                  soundSiren();
                }
                
                if(node[0].dataValues.alarm_triggers[i].record_cameras) {
                  sequelize.models.cameras.findAll({}).then(function(cameras){
                    for(var i=0;i<cameras.length;i++) {
                      if((cameras[i].dataValues.record_on_alarm) && (!camerasRecording)) {
                        console.log('recording cameras');
                        camerasRecording = true;
                        setTimeout(function(){
                          camerasRecording = false;
                        }, parseInt(config.cameras.alarm_record_time+'000',10));
                        childProcess.exec('/record-camera.sh '+cameras[i].dataValues.name.replace(/\s+/g, '')+' "'+cameras[i].dataValues.url+'" '+config.cameras.alarm_record_time,
                          function (error, stdout, stderr) {
                            console.log('stdout: ' + stdout);
                            console.log('stderr: ' + stderr);
                            if (error !== null) {
                              console.log('exec error: ' + error);
                            }
                        });
                      }
                    }
                  }, function(error){
                    console.log('error getting cameras for alarm');
                  });
                }
              }
            }
          }
        }, function(error) {
          console.log('error getting alarm triggers');
        });
      }
    }, function(error) {
      console.log('error getting alarm values');
    });
  }
  
  function soundSiren() {
    sequelize.models.nodes.findAll({
      where: {
        type: 'siren'
      }
    }).then(function(sirens) {
      var data = {
        class_id: 37,
        instance: 1,
        index: 0,
        value: true
      }
      for(var i=0;i<sirens.length;i++) {
        setValue(sirens[i].dataValues.node_id, data, function() {
          sirenOn = true;
          setTimeout(cancelSiren, 60000);
        });
      }
    });
  }
  
  function cancelSiren() {
    if(sirenOn) {
      sirenOn = false;
      sequelize.models.nodes.findAll({
        where: {
          type: 'siren'
        }
      }).then(function(sirens) {
        var data = {
          class_id: 37,
          instance: 1,
          index: 0,
          value: false
        }
        for(var i=0;i<sirens.length;i++) {
          setValue(sirens[i].dataValues.node_id, data, function() {});
        }
      });
    }
  }
  
  return {
    zwave: zwave,
    connect: connect,
    disconnect: disconnect,
    restart: restart,
    nodes: nodes,
    changePolling: changePolling,
    setValue: setValue,
    setConfigParam: setConfigParam,
    controllerReset: controllerReset,
    soundSiren: soundSiren,
    cancelSiren: cancelSiren,
    removeFailedNode: removeFailedNode,
    hasNodeFailed: hasNodeFailed,
    replaceFailedNode: replaceFailedNode,
    healNetworkNode: healNetworkNode,
    healNetwork: healNetwork
  }
}