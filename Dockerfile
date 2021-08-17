# Build

FROM node:12.20 AS build

ENV GATSBY_TELEMETRY_DISABLED 1

WORKDIR /app

COPY . /app

ARG PREFIX_PATHS

ARG POSTHOG_ENABLED

ARG POSTHOG_URL

ARG POSTHOG_APIKEY

RUN yarn install

RUN npm run build

RUN npm install -g node-pre-gyp

RUN yarn install --prod --modules-folder public/node_modules

# Production

FROM node:12.20-buster-slim

COPY --from=build /app/public /app/package.json /app/

COPY --from=build /app/prisma /app/prisma

COPY --from=build /app/prisma/schema.prisma /app/schema.prisma

COPY docker-entrypoint.sh /usr/local/bin/

RUN apt-get -qy update && apt-get -qy install openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

CMD ["node", "index.js"]

ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 3000
