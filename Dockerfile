FROM node:8.9.4

ENV NODE_ENV=production

WORKDIR /app
COPY . /app

RUN npm install
RUN npm run build
RUN rm -rf node_modules
RUN npm install --only=prod

CMD ["npm", "start"]

EXPOSE 4444
