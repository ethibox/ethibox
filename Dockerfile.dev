FROM node:8.11.4

RUN apt-get update && apt-get install -y jq sqlite3

RUN wget -O /usr/local/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/v1.11.2/bin/linux/amd64/kubectl

RUN curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get | sh

RUN chmod +x /usr/local/bin/helm /usr/local/bin/kubectl

VOLUME ["/app"]

WORKDIR /app

ENV NODE_ENV=development

CMD ["npm", "start"]

EXPOSE 3000 4444
