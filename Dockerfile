FROM node:8.9.4

WORKDIR /app
COPY . /app

RUN npm install
RUN make build
RUN rm -rf node_modules
RUN npm install --only=prod

CMD ["npm", "start"]

EXPOSE 4444
