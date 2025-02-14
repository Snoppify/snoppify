# snoppify

## Requirements

`npm`

## Installation and running

`npm i` to install

Then run these commands in parallell:

```
npm run start-server
```

```
npm run build -- --watch
```

### Electron

```
npm run start-electron
```

### Configuration

A `.env` file is required to run the client and server. This file contains URI:s, port number and app credentials:

```bash
CLIENT_URI = "http://localhost:3000"
SERVER_URI = "http://localhost:3002"
# Visible to the Vue client
VUE_APP_SERVER_URI = "http://localhost:3002"

PORT = 3000
SERVE_STATIC_CLIENT = false

SPOTIFY_CLIENT_ID = ...
SPOTIFY_CLIENT_SECRET = ...

GOOGLE_CLIENT_ID = ...
GOOGLE_CLIENT_SECRECT = ...

FACEBOOK_CLIENT_ID = ...
FACEBOOK_CLIENT_SECRET = ...
```

An additional `.env.production` is required to specify the URI:s used in production.

### Docker

To run the project in a docker environment use the command:

```bash
docker compose up -d
```

To rebuild the containers you can add the `--build` flag. The client runs on port 3000 and the server runs on port 3002.
