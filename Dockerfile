FROM node:lts-alpine

WORKDIR /app

COPY package*.json /app/

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
