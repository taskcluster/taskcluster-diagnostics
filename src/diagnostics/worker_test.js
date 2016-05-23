'use strict';
describe('Worker', function () {
  var taskcluster = require('taskclusterclient');
  var helper      = require('./helper');
  var slugid      = require('slugid');
  var debug       = require('debug')('worker:test');
  var assert      = require('assert');
  var request     = require('superagent-promise')

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
            debug(message.exchange);
            return resolve(message);
          }
        });
      });
    });

    return helper.listener.resume().then(() => {
      return helper.queue.defineTask(taskId, helper.simpleTaskDef(taskId));
    }).then(() => {
      return promise.taskDefined;
    }).then(() => {
      return helper.queue.scheduleTask(taskId);
    }).then(() => {
      return promise.taskPending;
    }).then(() => {
      return promise.taskRunning;
    }).then(() => {
      return promise.taskCompleted;
    }).then(() => {
      done();
    });
  });

  it('should create and fail a task', function (done) {
    this.timeout(120*1000);
    let taskId = slugid.nice();
    let promise = {};
    debug("TaskId", taskId);

    ['taskDefined',
    'taskPending',
    'taskFailed'].forEach(exch => {
      let r = helper.queueEvents[exch]({ taskId });
      helper.listener.bind(r);
      promise[exch] = new Promise((resolve, reject) => {
        return helper.listener.on('message', message => {
          if(message.exchange === r.exchange){
            debug(message.exchange);
            return resolve(message);
          }
        });
      });
    });

    return helper.listener.resume().then(() => {
      return helper.queue.defineTask(taskId, helper.exitTaskDefEnvVars(taskId,1));
    }).then(() => {
      return promise.taskDefined;
    }).then(() => {
      return helper.queue.scheduleTask(taskId);
    }).then(() => {
      return promise.taskPending;
    }).then(() => {
      return promise.taskFailed;
    }).then(() => {
      done();
    })
  });


  after(function () {
    helper.listener.close();
  })
});
