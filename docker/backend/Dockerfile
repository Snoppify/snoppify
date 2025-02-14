# syntax=docker/dockerfile:1
FROM node:bullseye

WORKDIR /app
COPY . .
RUN npm i && \
  npm run build-server

CMD ["npm", "run", "server"]
EXPOSE 3000
