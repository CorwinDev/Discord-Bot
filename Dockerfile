FROM node:24-bookworm

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "start"]