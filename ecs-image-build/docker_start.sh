#!/bin/bash
#
# Start script for dissolution web

PORT=3000

export NODE_PORT=${PORT}
exec node -r /opt/dist/openTelemetry.js /opt/dist/app.js -- ${PORT}
