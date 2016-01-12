module.exports = function(socketParam, awsParam, scenesParam, sequelizeParam) {
  var sequelize = sequelizeParam;
  var scenes = scenesParam;
  var socket = socketParam;
  var aws = awsParam;
  var ZWave = require('../../node_modules/openzwave-shared/lib/openzwave-shared.js');
  var os = require('os');
  var zwave = new ZWave({ConsoleOutput: false});
  var nodes = [];
  var zwavedriverpaths = {'darwin': '/dev/cu.usbmodem1411', 'linux': '/dev/ttyUSB0', 'windows': '\\\\.\\COM3'};
  var scanComplete = false;

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
    //socket.updateNodes(nodes);
  });

  zwave.on('value changed', function (nodeid, comclass, value) {
    if(nodes[nodeid]['classes'][comclass][value.index].value !== value.value) {
      nodes[nodeid]['classes'][comclass][value.index] = value;
      //socket.updateNodes(nodes);
      if(scanComplete) {
        checkAlarm(nodeid, comclass, value);
      }
    }
  });

  zwave.on('value removed', function (nodeid, comclass, index) {
    if (nodes[nodeid]['classes'][comclass] && nodes[nodeid]['classes'][comclass][index]) {
      delete nodes[nodeid]['classes'][comclass][index];
    }
    //socket.updateNodes(nodes);
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
    //socket.updateNodes(nodes);
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
    //scenes.runScene(sceneid);
  });
  
  zwave.on('node event', function(nodeid, sceneid) {
    console.log('node event '+nodeid+' '+sceneid);
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
      zwave.setValue({nodeid: nodeid, class_id: data.class_id, instance: data.instance, inded: data.index}, data.value);
      callback(200, {message: 'node successfully updated'});
    }
    catch (error) {
      callback(400, {message: String(error)});
    }
  }

  function controllerReset(callback) {
    try {
      zwave.hardReset();
      callback(200, {message: 'performing hard reset on the controller'});
    }
    catch (error) {
      callback(400, {message: String(error)});
    }
  }
  
  function checkAlarm(nodeid, comclass, value) {
    /*GLOBAL.mysqlGlobal.getAlarm(function(status, response) {
      if(response.data[0].armed) {
        GLOBAL.mysqlGlobal.getNode(nodeid, function(status, response) {
          if(typeof response.data.nodes_alarm !== 'undefined') {
            for(var i=0;i<response.data.nodes_alarm.length;i++) {
              if(response.data.nodes_alarm[i].class_id === comclass) {
                if((response.data.nodes_alarm[i].value == 'true') === value.value) {
                  if(response.data.nodes_alarm[i].sms) {
                    //TODO: send real sms
                    //aws.sendSMS(response.data.name+' alarm!');
                    console.log(response.data.name+' alarm!');
                  }

                  if(response.data.nodes_alarm[i].siren) {
                    //TODO: sound siren
                    console.log('siren!');
                  }
                }
              }
            }
          }
        });
      }
    });*/
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
    controllerReset: controllerReset
  }
}