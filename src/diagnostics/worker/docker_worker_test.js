'use strict';
describe('DockerWorker', function () {
  var taskcluster = require('taskcluster-client');
  var helper      = require('../helper');
  var slugid      = require('slugid');
  var debug       = require('debug')('worker:test');
  var assume      = require('assume');
  var request     = require('superagent-promise')(require('superagent'), require('bluebird'));

  var currentListener = null;

  it("should create and complete a task",async function (done) {
    this.timeout(120*1000);
    let taskId = slugid.nice();
    let listener = helper.createNewListener();
    currentListener = listener;
    debug("TaskId", taskId);

    listener.bind(helper.queueEvents.taskCompleted({ taskId }));

    let taskCompleted = new Promise((resolve, reject) => {
      return listener.on('message', message => {
        debug(message.exchange);
        return resolve(message);
      }).on('error', reject);
    });

    try{
      await listener.resume();
      await helper.queue.defineTask(taskId, helper.simpleTaskDef(taskId));
      await helper.queue.scheduleTask(taskId);
      await taskCompleted;
      done();
    } catch (err) {
      done(err);
    }
  });

  it('should create and fail a task', async function (done) {
    this.timeout(120*1000);
    let taskId = slugid.nice();
    debug("TaskId", taskId);
    let listener = helper.createNewListener();
    currentListener = listener;

    listener.bind(helper.queueEvents.taskFailed({ taskId }));

    let taskFailed = new Promise((resolve, reject) => {
      return listener.on('message', message => {
        debug(message.exchange);
        return resolve(message);
      }).on('error', reject);
    });

    try{
      await listener.resume();
      await helper.queue.defineTask(taskId, helper.exitTaskDefEnvVars(taskId,1));
      await helper.queue.scheduleTask(taskId);
      await taskFailed;
      done();
    } catch (err) {
      done(err);
    }
  });

  it('should access created artifacts', async function (done) {
    this.timeout(120*1000);

    let taskId = slugid.nice();
    debug("TaskId", taskId);

    let listener = helper.createNewListener();
    currentListener = listener;

    let promise = {};
    ['artifactCreated',
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

    try{
      await listener.resume();
      await helper.queue.defineTask(taskId, helper.simpleTaskDef(taskId));
      await helper.queue.scheduleTask(taskId);
      await promise.artifactCreated;
      await promise.taskCompleted;

      let artifactName = 'public/logs/live_backing.log';
      let url = helper.queue.buildUrl(helper.queue.getArtifact, taskId, 0, artifactName);
      let response = await request.get(url).end();
      debug(response.text);
      assume(response.statusCode).equals(200);
      done();
    } catch (err) {
      done(err);
    }

  });

  afterEach(() => {
    currentListener.close();
  });

});
