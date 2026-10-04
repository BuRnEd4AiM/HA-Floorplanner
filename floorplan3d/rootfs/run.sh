#!/usr/bin/with-contenv bashio

export LOG_LEVEL="$(bashio::config 'log_level')"
export DATA_DIR="/data"

bashio::log.info "Starting 3D Floorplan on port 8099 ..."
exec python3 /app/server.py
