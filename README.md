TaskCluster Diagnostics
=======================

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
For local development you should create the file
`taskcluster-diagnostics.conf.json` add configuration that is specified as
missing in `config/defaults.js`, then run `npm test`.

Example of `taskcluster-diagnostics.conf.json`:
```js
{
  "taskcluster": {
    "credentials": {        // These are not valid credentials
      "clientId":           "2wLPBe_YTJOnetPudn4VzQ",
      "accessToken":        "27hxpUPgR7uYU3MYgMkqTQB4CTe614S6SfG0Ky54Lbew"
    }
  },
  "pulse": {
    "username":             "my-pulse-username",
    "password":             "my-pulse-password"
  }
}
```

