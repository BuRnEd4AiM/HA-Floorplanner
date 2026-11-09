ARG BUILD_FROM=ghcr.io/home-assistant/base:3.21
FROM $BUILD_FROM

RUN apk add --no-cache python3 py3-aiohttp

COPY rootfs /
# the beta (floorplan3d/); tools/stable.py writes "stable" into the copy of the normal add-on (channel.py)
ENV FP_CHANNEL=beta
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
