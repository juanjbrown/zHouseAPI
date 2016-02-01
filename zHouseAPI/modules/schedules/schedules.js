module.exports = function(sequelize, scenes) {
  var Later = require('later');
  var SunCalc = require('suncalc');
  var CronJob = require('cron').CronJob;
  var schedules = [];
  var scheduleContext = [];
  var suncalc;
  var dawnSchedule;
  var duskSchedule;
  var dawnTimeout;
  var duskTimeout;
  
  later.date.localTime();

  function initialize() {
    updateSunCalc();
    new CronJob('0 0 * * *', updateSunCalc, null, true, "America/New_York");
    
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
  
  function updateSunCalc() {
    console.log('updating suncalc');
    if(typeof dawnTimeout !== 'undefined') {
      console.log('clearing old sun based schedules');
      dawnTimeout.clear();
      duskTimeout.clear();
    }
    sequelize.models.location.findAll({}).then(function(location) {
      suncalc = SunCalc.getTimes(new Date(), location[0].latitude, location[0].longitude);
      suncalc.sunrise = new Date(suncalc.sunrise.getTime()-15*60000);
      suncalc.sunset = new Date(suncalc.sunset.getTime()+15*60000);
      console.log('setting schedule for 15 minutes before sunrise ('+suncalc.sunrise+')');
      console.log('setting schedule for 15 minutes after sunset ('+suncalc.sunset+')');
      dawnSchedule = Later.parse.recur().on(suncalc.dawn).fullDate();
      duskSchedule = Later.parse.recur().on(suncalc.dusk).fullDate();
      dawnTimeout = Later.setTimeout(runDawn, dawnSchedule);
      duskTimeout = Later.setTimeout(runDusk, duskSchedule);
    });
  }
  
  function runDawn() {
    console.log('running dawn scenese');
    sequelize.models.scenes.findAll({
      where: {
        dawn: true
      }
    }).then(function(scenes) {
      for(var i=0;i<scenes.length;i++) {
        scenes.runScene(scenes[i].dataValues.scene_id);
      }
    });
  }
  
  function runDusk() {
    console.log('running dusk scenes');
    sequelize.models.scenes.findAll({
      where: {
        dusk: true
      }
    }).then(function(scenes) {
      for(var i=0;i<scenes.length;i++) {
        scenes.runScene(scenes[i].dataValues.scene_id);
      }
    });
  }

  function createJob(id, cron) {
    scheduleContext[id] = {"id": id};
    schedules[id] = new CronJob(cron, runJob, null, true, "America/New_York", scheduleContext[id]);
  }
  
  function deleteJob(id) {
    if(typeof schedules[id] !== 'undefined') {
      schedules[id].stop();
    }
  }

  function runJob() {
    console.log('running schedule'+this.id);
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