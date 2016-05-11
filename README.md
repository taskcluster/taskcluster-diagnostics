TaskCluster Diagnostics
=======================

[![Build Status](https://travis-ci.org/ckousik/taskcluster-diagnostics.svg?branch=master)](https://travis-ci.org/ckousik/taskcluster-diagnostics)

The taskcluster diagnotics component runs tests against the production
deployment of taskcluster. This is intend to quickly notify us if for some
reason the production deployment breaks. This can happen both when we deploy
updates, modify configuration or permissions granted in third-party services,
for example permissions for AWS IAM users. With peridic tests we can avoid
unpleasent surprises, like realizing that a features in our production
deployment have been broken for weeks without anybody noticing.

This also serves as quick way for us to run some tests against the production
deployment, which is very useful to do every time we deploy updates. Even though
we test our code before deployment, no amount of unit-tests and black box tests
will catch the case where we deploy a source update, but forget to update
deployment configuration necessary adjustments like new AWS credentials, etc.

Local Development
-----------------

Create a file `user-config.yml`
```yaml
defaults:
  taskcluster:
    # if clientId is persona/chinmaykousik1@gmail.com/tc-diagnostics, then
    # baseclientId will be persona/chinmaykousik1@gmail.com/
    baseClientId:   base_clientId
    credentials:
      clientId:     taskcluster_clientId
      accessToken:  taskcluster_accessToken

  pulse:
    username:       pulse_username
    password:       pulse_password

```
