ARG BUILD_FROM=ghcr.io/home-assistant/base:3.21
FROM $BUILD_FROM

RUN apk add --no-cache python3 py3-aiohttp

COPY rootfs /
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
