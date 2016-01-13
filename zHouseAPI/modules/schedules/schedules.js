module.exports = function(scenes) {
  //TODO: fix this
  var CronJob = require('cron').CronJob;
  var schedules = [];
  var scheduleContext = [];


  function initSchedules() {
    GLOBAL.mysqlGlobal.getSchedules(function(status, response){
      for(var i=0;i<response.data.length;i++) {
        createJob(response.data[i].id, response.data[i].cron, response.data[i].sceneids)
      }
    });
  }

  function createJob(id, cron, sceneids) {
    scheduleContext[id] = {"sceneids": sceneids};
    schedules[id] = new CronJob(cron, runJob, null, true, "America/New_York", scheduleContext[id]);
  }

  function runJob() {
    var scenesArray = this.sceneids.split(',');
    for(var i=0;i<scenesArray.length;i++) {
      scenes.runScene(scenesArray[i]);
    }
  }
  
  function reloadSchedules() {
    for(var i=0;i<schedules.length;i++) {
      if(typeof schedules[i] !== 'undefined') {
        schedules[i].stop();
      }
    }
    schedules = [];
    initSchedules();
  }
  
  return {
    initSchedules: initSchedules,
    reloadSchedules: reloadSchedules
  }
}