#!/bin/bash
# Start script for the service
npm i
PORT=3000

exec node /opt/dist/app.js -- ${PORT}
