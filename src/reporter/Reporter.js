'use strict';
var AWS     = require('aws-sdk');
var debug   = require('debug')('diagnostics:reporter');
var helper  = require('../helper');
var _       = require('lodash');
var taskcluster = require('taskcluster-client');

const MAX_NUMBER = 999999999999999;

/* This class uploads logs to s3*/
class Reporter {
  constructor (testId) {
    //init s3
    AWS.config.update({
      credentials:  helper.cfg.aws.credentials,
      region:       helper.cfg.aws.region
    });

    this.testId = testId;
    this.env = helper.cfg.env || 'development';

    this.s3 = new AWS.S3({ params: { Bucket: helper.cfg.aws.bucket } });
    this.makeResultString = this.makeResultString.bind(this);
    this.upload = this.upload.bind(this);
  }

  setTestId (testId) {
    this.testId = testId;
  }

  makeResultString () {
    //override this
  }

  upload (result) {
    let Key = this.makeResultString(result);
    console.log("Uploading object:", Key);

    let params = {
      Key ,
      Body:         JSON.stringify(result),
      ContentType:  this.ContentType
    };

    return new Promise((resolve, reject) => {
      return this.s3.putObject(params, (err, data) => {
        if(err){
          console.error(err);
          return reject(err);
        }
        return resolve(Key);
      });
    });
  }

}

/* Upload JSON logs */

class JSONReporter extends Reporter {
  constructor (testId) {
    super(testId);
    this.ContentType      = 'application/json';
    this.makeResultString = this.makeResultString.bind(this);
  }

  makeResultString (result) {
    let rev_date = MAX_NUMBER - Math.round(Date.now()/1000);
    let stamp = (new Date()).toJSON();
    return [this.env,
      'JSON',
      rev_date,
      stamp,
      this.testId + '.json'].join('/');
  }
}

/* Upload raw logs */

class LogReporter extends Reporter {
  constructor (testId) {
    super(testId);
    this.ContentType      = 'text/plain';
    this.makeResultString = this.makeResultString.bind(this);
  }

  makeResultString (result) {
    let rev_date  = MAX_NUMBER - Math.round(Date.now()/1000);
    let stamp     = (new Date()).toJSON();
    return [this.env,'RAW',
      rev_date,
      stamp,
      this.testId + '.log' ].join('/');
  }
}

var createJSONReporter = (testId) => {
  return new JSONReporter(testId);
}

var createLogReporter = (testId) => {
  return new LogReporter(testId);
}

module.exports = {
  createJSONReporter,
  createLogReporter
}

