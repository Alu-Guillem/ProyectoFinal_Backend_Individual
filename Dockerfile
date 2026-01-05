# Dockerfile - Hotel Pere Maria API
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY index.js jsconfig.json ./

EXPOSE 3000

CMD ["node", "index.js"]
