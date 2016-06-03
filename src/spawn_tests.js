'use strict';

var spawn         = require('child_process').spawn;
var StringDecoder = require('string_decoder').StringDecoder;
var path          = require('path');
var slugid        = require('slugid');
var LogReporter   = require('./reporter/Reporter').LogReporter;

/*
  This module generates a testId and spawns a TestRunner which runs tests and
  uploads raw logs.
  The uploading and running will be separated soon
*/

class TestSpawn {
  constructor () {
    this.reporter = new LogReporter();
    this.decoder = new StringDecoder('utf8');
    this._spawnTests = this._spawnTests.bind(this);
  }

  _spawnTests () {
    let testId = slugid.nice();
    let outbuff = '';

    this.reporter.setTestId(testId);
    console.log("Running tests with id",testId);

    let addToBuffer = data => {
      let str = this.decoder.write(data);
      outbuff += str;
      console.log(str);
    }

    let startMessage = "Test started at " + (new Date()).toJSON() + "\n";
    outbuff += startMessage;
    console.log(startMessage);

    let s = spawn('node',['lib/tests.js','--id',testId],{
      cwd: path.join(__dirname,'../'),
      detached: true
    });

    s.stdout.on('data',addToBuffer);
    s.stderr.on('error',addToBuffer);

    s.on('close',async () => {
      var endMessage = "Tests ended at "+ (new Date()).toJSON() + "\n";
      outbuff += endMessage;
      console.log(outbuff);
      var result = await this.reporter.upload(outbuff)
      console.log(result);
    });
  }

}

(new TestSpawn())._spawnTests();
