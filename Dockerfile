FROM node:8.9.4

WORKDIR /app

COPY . /app

ENV NODE_ENV=production

RUN wget -O /usr/local/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/v1.11.2/bin/linux/amd64/kubectl

RUN curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get | bash

RUN chmod +x /usr/local/bin/helm /usr/local/bin/kubectl

VOLUME /app/data

CMD ["npm", "start"]

EXPOSE 4444
