#!/usr/bin/env bash

#Use for testing only
npm run compile
python isolate.py auth_test.js
DEBUG=* node lib/main.js
