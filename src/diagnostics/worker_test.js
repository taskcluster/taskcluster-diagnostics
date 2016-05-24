'use strict';
describe('Worker', function () {
  var taskcluster = require('taskcluster-client');
  var helper      = require('./helper');
  var slugid      = require('slugid');
  var debug       = require('debug')('worker:test');
  var assert      = require('assert');
  var request     = require('superagent');

  var currentListener = null;
  
  it("should create and complete a task", function (done) {
    this.timeout(120*1000);
    let taskId = slugid.nice();
    let promise = {};
    let runId, workerId, workerGroup;
    let listener = helper.createNewListener();
    currentListener = listener;
    debug("TaskId", taskId);
    ['taskDefined',
    'taskPending',
    'taskRunning',
    'taskCompleted'].forEach(exch => {
      let r = helper.queueEvents[exch]({ taskId });
      listener.bind(r);
      promise[exch] = new Promise((resolve, reject) => {
        return listener.on('message', message => {
          if(message.exchange === r.exchange){
            debug(message.exchange);
            return resolve(message);
          }
        });
      });
    });

    return listener.resume().then(() => {
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
    let listener = helper.createNewListener();
    currentListener = listener;
    ['taskDefined',
    'taskPending',
    'taskFailed'].forEach(exch => {
      let r = helper.queueEvents[exch]({ taskId });
      listener.bind(r);
      promise[exch] = new Promise((resolve, reject) => {
        return listener.on('message', message => {
          if(message.exchange === r.exchange){
            debug(message.exchange);
            return resolve(message);
          }
        });
      });
    });

    return listener.resume().then(() => {
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

  it('should access created artifacts', function (done) {
    this.timeout(120*1000);
    let taskId = slugid.nice();
    let promise = {};
    debug("TaskId", taskId);
    let listener = helper.createNewListener();
    currentListener = listener;
    ['taskDefined',
    'taskPending',
    'artifactCreated',
    'taskCompleted'].forEach(exch => {
      let r = helper.queueEvents[exch]({ taskId });
      listener.bind(r);
      promise[exch] = new Promise((resolve, reject) => {
        return listener.on('message', message => {
          if(message.exchange === r.exchange){
            debug(message.exchange);
            return resolve(message);
          }
        });
      });
    });

    return listener.resume().then(() => {
      return helper.queue.defineTask(taskId, helper.simpleTaskDef(taskId));
    }).then(() => {
      return promise.taskDefined;
    }).then(() => {
      return helper.queue.scheduleTask(taskId);
    }).then(() => {
      return promise.taskPending;
    }).then(() => {
      return promise.artifactCreated;
    }).then(() => {
      return promise.taskCompleted;
    }).then(() => {
      let artifactName = 'public/logs/live_backing.log';
      let url = helper.queue.buildUrl(helper.queue.getArtifact, taskId, 0, artifactName);
      debug(url);
      return request.get(url).end((err, response) => {
        debug(response);
        assert(response.statusCode === 200);
        done();
      });
    });
  });

  afterEach(() => {
    currentListener.close();
  });

});
