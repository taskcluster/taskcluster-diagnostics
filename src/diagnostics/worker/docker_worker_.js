'use strict';
describe('DockerWorker', function () {
  var taskcluster = require('taskcluster-client');
  var helper      = require('../../helper');
  var slugid      = require('slugid');
  var debug       = require('debug')('worker:test');
  var assume      = require('assume');
  var request     = require('superagent-promise')(require('superagent'), require('bluebird'));

  var currentListener = null;

  it("should create and complete a task",async function (done) {
    this.timeout(10*60*1000);
    let taskId = slugid.nice();
    let listener = helper.createNewListener();
    currentListener = listener;
    debug("TaskId", taskId);


    let taskCompleted = new Promise((resolve, reject) => {
      return listener.on('message', message => {
        debug(message.exchange);
        return resolve(message);
      }).on('error', reject);
    });

    try{
      await listener.bind(helper.queueEvents.taskCompleted({ taskId }));
      debug("Bound to taskCompleted");
      await listener.resume();
      debug("Listening...");
      await helper.queue.createTask(taskId, helper.simpleTaskDef(taskId));
      debug("Task created...");
      await helper.queue.scheduleTask(taskId);
      debug("Task scheduled...");
      await taskCompleted;
      done();
    } catch (err) {
      done(err);
    }
  });

  it('should create and fail a task', async function (done) {
    this.timeout(10*60*1000);
    let taskId = slugid.nice();
    debug("TaskId", taskId);
    let listener = helper.createNewListener();
    currentListener = listener;


    let taskFailed = new Promise((resolve, reject) => {
      return listener.on('message', resolve).on('error', reject);
    });

    try{
      await listener.bind(helper.queueEvents.taskFailed({ taskId }));
      debug("Bound to taskFailed");
      await listener.resume();
      debug("Listening...");
      await helper.queue.createTask(taskId, helper.exitTaskDefEnvVars(taskId,1));
      debug("Task created...");
      await helper.queue.scheduleTask(taskId);
      debug("Task scheduled");
      await taskFailed;
      return done();
    } catch (err) {
      done(err);
    }
  });

  it('should access created artifacts', async function (done) {
    this.timeout(10*60*1000);

    let taskId = slugid.nice();
    debug("TaskId", taskId);

    let listener = helper.createNewListener();
    currentListener = listener;

    let taskCompleted = new Promise((resolve, reject) => {
      return listener.on('message', message => {
        debug(message.exchange);
        return resolve(message);
      }).on('error', reject);
    });

    try{
      await listener.bind(helper.queueEvents.taskCompleted({ taskId }));
      debug("Bound to exchange");
      await listener.resume();
      debug("Listening");
      await helper.queue.createTask(taskId, helper.simpleTaskDef(taskId));
      debug("Task created");
      await helper.queue.scheduleTask(taskId);
      debug("Task scheduled");
      await taskCompleted;

      let artifactName = 'public/logs/live_backing.log';
      let url = helper.queue.buildUrl(helper.queue.getArtifact, taskId, 0, artifactName);
      let response = await request.get(url).end();
      debug("Artifact retrieved");
      debug(response.text);
      assume(response.statusCode).equals(200);
      done();
    } catch (err) {
      done(err);as
    }finally {
      currentListener.close(); //Added for safety
    }

  });

  afterEach(() => {
    currentListener.close();
  });

});
