FROM node:24 AS build

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY . /app

ARG NEXT_PUBLIC_BASE_PATH

RUN yarn install \
    && yarn build \
    && rm -rf node_modules \
    && yarn install --prod --ignore-optional

FROM gcr.io/distroless/nodejs24

WORKDIR /app

COPY --from=build /app/ ./

ENV NODE_ENV=production

VOLUME /app/data

EXPOSE 3000

HEALTHCHECK --interval=1m --start-period=20s CMD ["/nodejs/bin/node", "lib/healthcheck.js"]

CMD ["node_modules/.bin/next", "start"]
