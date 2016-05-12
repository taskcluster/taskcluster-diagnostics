'use strict';
suite('Testing worker', function () {
  var taskcluster = require('taskcluster-client');
  var helper      = require('../helper')();
  var slugid      = require('slugid');

  it("should create and complete a task", function (done) {

    let taskId = slugid.nice();
    let promise = {};

    ['taskDefined',
    'taskPending',
    'taskRunning',
    'taskCompleted',
    'artifactCreated',
    'taskCompleted'].map(exch => {
      let r = helper.queueEvents[exch]({ taskId });
      helper.listener.bind(r);

      promise[exch] = new Promise((resolve, reject) => {
        helper.listener.on('message', message => {
          if(message.exchange === helper.queueEvents[exch]().exchange){
            return resolve(message.payload);
          }
        }).on('error', () => {
          throw new Error("Error at: "+exch);
        });
      });
    });

    helper.listener.resume().then(() => {
      return helper.queue.defineTask(taskId, helper.simpleTaskDef(taskId));
    }).then(() => {
      return promise.taskDefined;
    }).then(() => {
      return helper.queue.scheduleTask(taskId);
    }).then(() => {
      return promise.taskPending;
    }).then(() => {
      return helper.queue.claimTask(taskId, {
        //workers
      });
    }).then(() => {
      return promise.taskRunning;
    }).then(() => {
      return promise.taskCompleted;
    });
  });

  after(function () {
    helper.listener.close();
  })
});
