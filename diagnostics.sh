DEBUG=spawn,worker:test,secrets:test,auth:test,queue:test,index:test,\
diagnostics:reporter,diagnostics:runner,diagnostics:test-server \
npm run compile
python isolate.py auth_test.js
node lib/main.js default
