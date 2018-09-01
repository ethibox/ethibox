# Build

FROM node:8.11.4-alpine AS build

RUN apk add --no-cache openssl libressl curl git make gcc g++ python

RUN wget -O /usr/local/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/v1.11.2/bin/linux/amd64/kubectl

RUN curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get | sh

RUN chmod +x /usr/local/bin/helm /usr/local/bin/kubectl

WORKDIR /app

COPY . /app

RUN npm install && npm rebuild node-sass

RUN npm run build

RUN cp package.json public && cd public && npm i --prod && npm rebuild bcrypt --build-from-source

# Production

FROM node:8.11.4-alpine

RUN apk add --no-cache curl jq

COPY --from=build /usr/local/bin/helm /usr/local/bin/helm

COPY --from=build /usr/local/bin/kubectl /usr/local/bin/kubectl

COPY --from=build /app/public /app

VOLUME ["/app/data"]

WORKDIR /app

ENV NODE_ENV=production

CMD ["node", "index.js"]

EXPOSE 4444
