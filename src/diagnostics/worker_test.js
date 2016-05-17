'use strict';
describe('Worker', function () {
  var taskcluster = require('taskcluster-client');
  var helper      = require('./helper');
  var slugid      = require('slugid');
  var debug       = require('debug')('worker:test');

  it("should create and complete a task", function (done) {
    this.timeout(60*1000);
    let taskId = slugid.nice();
    let promise = {};

    ['taskDefined',
    'taskPending',
    'taskRunning',
    'taskCompleted',
    'artifactCreated',
    'taskCompleted'].forEach(exch => {
      let r = helper.queueEvents[exch]({ taskId });
      helper.listener.bind(r);

      promise[exch] = new Promise((resolve, reject) => {
        helper.listener.on('message', message => {
          if(message.exchange === helper.queueEvents[exch]().exchange){
            console.log(message.exchange);
            console.log(exch,': ',message.payload);
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
