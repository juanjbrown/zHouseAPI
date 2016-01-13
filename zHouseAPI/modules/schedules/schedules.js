module.exports = function(sequelize, scenes) {
  var CronJob = require('cron').CronJob;
  var schedules = [];
  var scheduleContext = [];


  function initialize() {
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
      if(schedules.length !== 0) {
        for(var i=0;i<schedules.length;i++) {
          createJob(schedules[i].dataValues.id, schedules[i].dataValues.cron);
        }
      }
    });
  }

  function createJob(id, cron) {
    scheduleContext[id] = {"id": id};
    schedules[id] = new CronJob(cron, runJob, null, true, "America/New_York", scheduleContext[id]);
  }
  
  function deleteJob(id) {
    if(typeof schedules[id] !== 'undefined') {
      //TODO: this is not working :(
      schedules[id].stop();
    }
  }

  function runJob() {
    var scheduleid = this.id;
    sequelize.models.scheduleScenes.findAll({
      where: {
        schedule_id: scheduleid
      }
    }).then(function(scheduleScene) {
      for(var i=0;i<scheduleScene.length;i++) {
        scenes.runScene(scheduleScene[i].dataValues.scene_id);
      }
    });
  }
  
  function reload() {
    for(var i=0;i<schedules.length;i++) {
      if(typeof schedules[i] !== 'undefined') {
        schedules[i].stop();
      }
    }
    schedules = [];
    initSchedules();
  }
  
  function createSchedule(id, cron) {
    scheduleContext[id] = {"id": id};
    schedules[id] = new CronJob(cron, runJob, null, true, "America/New_York", scheduleContext[id]);
  }
  
  return {
    initialize: initialize,
    reload: reload,
    createJob: createJob,
    deleteJob: deleteJob
  }
}