FROM node:22 AS build

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY . /app

ARG NEXT_PUBLIC_BASE_PATH

RUN yarn install \
    && yarn build \
    && rm -rf node_modules \
    && yarn install --prod --ignore-optional

FROM gcr.io/distroless/nodejs22

WORKDIR /app

COPY --from=build /app/ ./

ENV NODE_ENV=production

VOLUME /app/data

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
