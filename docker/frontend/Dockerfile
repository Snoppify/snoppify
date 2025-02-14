# syntax=docker/dockerfile:1
FROM node:bullseye

WORKDIR /app
COPY . .
RUN npm i && \
  npm run build-client

CMD ["npm", "run", "start-client"]
EXPOSE 3000
