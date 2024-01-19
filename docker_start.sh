#!/bin/bash
# Start script for the service
PORT=3000

exec node /opt/dist/app.js -- ${PORT}
