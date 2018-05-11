FROM node:8.9.4

WORKDIR /app
COPY . /app

RUN npm install
RUN npm run build
RUN rm -rf node_modules
RUN npm install --only=prod

ENV NODE_ENV=production
CMD ["npm", "start"]

EXPOSE 4444
