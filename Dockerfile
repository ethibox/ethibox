FROM node:18 AS build

ENV NEXT_TELEMETRY_DISABLED 1

WORKDIR /app

COPY . /app

ARG NEXT_PUBLIC_BASE_PATH

RUN yarn install \
    && yarn build \
    && rm -rf node_modules \
    && yarn install --prod --ignore-optional

FROM gcr.io/distroless/nodejs:18

WORKDIR /app

COPY --from=build /app/.next/ ./.next/

COPY --from=build /app/.env ./.env

COPY --from=build /app/public ./public

COPY --from=build /app/lib ./lib

COPY --from=build /app/next.config.js ./next.config.js

COPY --from=build /app/package.json ./package.json

COPY --from=build /app/node_modules/ ./node_modules/

ENV NODE_ENV=production

VOLUME /app/data

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
