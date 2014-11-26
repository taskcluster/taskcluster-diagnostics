module.exports = {
  taskcluster: {
    credentials: {
      // Credentials are provided through environment variables in production
      // and taskcluster-diagnostics.conf.json in the development setup
      clientId:                         undefined,
      accessToken:                      undefined
    }
  },
  pulse: {
    // Pulse username/password provided through environment variables in
    // production and taskcluster-diagnostics.conf.json in the development setup
    username:       undefined,
    password:       undefined
  }
};
