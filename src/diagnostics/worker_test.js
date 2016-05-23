'use strict';
describe('Worker', function () {
  var taskcluster = require('taskcluster-client');
  var helper      = require('./helper');
  var slugid      = require('slugid');
  var assert      = require('assert');
  var debug       = require('debug')('worker:test');
  var request     = require('superagent-promise');

  it("should create and complete a task", function (done) {
    this.timeout(120*1000);
    let taskId = slugid.nice();
    let promise = {};
    debug("TaskId", taskId);
    ['taskDefined',
    'taskPending',
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

  it('should retrieve created artifacts', function (done) {
    this.timeout(120*1000);
    let taskId = slugid.nice();
    let promise = {};
    debug("TaskId", taskId);
    ['taskDefined',
    'taskPending',
    'artifactCreated',
    'taskCompleted'].forEach(exch => {
      let r = helper.queueEvents[exch]({ taskId });
      helper.listener.bind(r);
      promise[exch] = new Promise((resolve, reject) => {
        return helper.listener.on('message', message => {
          if(message.exchange === r.exchange){
            if(exch === 'artifactCreated'){
              debug(message);
            }
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
    }). then(() => {
      return promise.taskPending;
    })
    .then(() => {
      return promise.taskCompleted;
    }).then(() => {
      let testArtifactName = 'public/logs/live.log'
      let url = helper.queue.buildUrl(helper.queue.getArtifact, taskId, 0, testArtifactName);
      debug(url);
      return request.get(url).end().then(response => {
        debug("Response status code:", response.statusCode);
        assert(response.statusCode === 200, "Wrong status code");
        debug(response.text);
        done();
      }).catch(done)
    });
  })

  after(function () {
    helper.listener.close();
  })
});
