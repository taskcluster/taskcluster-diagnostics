'use strict';
describe('Worker', function () {
  var taskcluster = require('taskcluster-client');
  var helper      = require('./helper');
  var slugid      = require('slugid');
  var debug       = require('debug')('worker:test');

  it("should create and complete a task", function (done) {
    this.timeout(120*1000);
    let taskId = slugid.nice();
    let promise = {};
    let runId, workerId, workerGroup;
    debug("TaskId", taskId);
    ['taskDefined',
    'taskPending',
    'taskRunning',
    'taskCompleted'].forEach(exch => {
      let r = helper.queueEvents[exch]({ taskId });
      helper.listener.bind(r);
      promise[exch] = new Promise((resolve, reject) => {
        return helper.listener.on('message', message => {
          if(message.exchange === r.exchange){
            if(exch === 'taskCompleted'){
              done();
            }
            debug(message.exchange);
            return resolve(message);
          }
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
    }).then(pendingResult => {
      let runs = pendingResult.status.runs;
      runId = runs[0].runId;
      workerId = runs[0].workerId;
      workerGroup = runs[0].workerGroup;
      return helper.queue.claimTask(taskId, runId, { workerId, workerGroup });
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
