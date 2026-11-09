# 3D Floorplan without the Supervisor: for Home Assistant as a plain Docker container ("Home Assistant Container", #489).
# The same program as the add-on, started without bashio; how to run it: container/README.md.
# Build from the repository's main folder:  docker build -f container/Dockerfile -t floorplan3d .
# Normal and Beta (5.2.0): the normal version (floorplan3d-stable/, only released versions) unless the build argument says
#   CHANNEL=beta (floorplan3d/, every new version at once):  docker build -f container/Dockerfile --build-arg CHANNEL=beta -t floorplan3d .
FROM alpine:3.21 AS source
ARG CHANNEL=stable
COPY floorplan3d-stable/rootfs/app /stable
COPY floorplan3d/rootfs/app /beta
RUN case "$CHANNEL" in stable|beta) mv "/$CHANNEL" /app ;; *) echo "CHANNEL must be stable or beta, not $CHANNEL" >&2; exit 1 ;; esac

FROM alpine:3.21
ARG CHANNEL=stable
RUN apk add --no-cache python3 py3-aiohttp tzdata
COPY --from=source /app /app
ENV DATA_DIR=/data \
    PORT=8099 \
    LOG_LEVEL=info \
    FP_CHANNEL=$CHANNEL
VOLUME /data
EXPOSE 8099
CMD ["python3", "/app/server.py"]
