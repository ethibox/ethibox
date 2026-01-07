FROM node:24 AS build

ARG DOCKER_VERSION=29.1.3

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY . /app

RUN yarn install \
    && yarn build \
    && rm -rf node_modules \
    && yarn install --prod --ignore-optional

RUN curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_VERSION}.tgz | tar -xz -C /tmp

FROM gcr.io/distroless/nodejs24@sha256:cdf42f994cee425970f30a0d0e37112dcc800737dde7bba50415612702b399af

WORKDIR /app

COPY --from=build /app/ ./

COPY --from=build /tmp/docker/docker /usr/bin/docker

ENV NODE_ENV=production

VOLUME /app/data

EXPOSE 3000

HEALTHCHECK --interval=1m --start-period=20s CMD ["/nodejs/bin/node", "lib/healthcheck.js"]

CMD ["node_modules/.bin/next", "start"]
