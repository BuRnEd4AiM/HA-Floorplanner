# 3D Floorplan without the Supervisor: for Home Assistant as a plain Docker container ("Home Assistant Container", #489).
# The same program as the add-on, started without bashio; how to run it: container/README.md.
# Build from the repository's main folder:  docker build -f container/Dockerfile -t floorplan3d .
FROM alpine:3.21
RUN apk add --no-cache python3 py3-aiohttp tzdata
COPY floorplan3d/rootfs/app /app
ENV DATA_DIR=/data \
    PORT=8099 \
    LOG_LEVEL=info
VOLUME /data
EXPOSE 8099
CMD ["python3", "/app/server.py"]
