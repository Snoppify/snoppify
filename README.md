# snoppify

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d35cacd7e21445479f1a1b838a4334c4)](https://app.codacy.com/app/mold/snoppify?utm_source=github.com&utm_medium=referral&utm_content=mold/snoppify&utm_campaign=Badge_Grade_Settings)

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
SERVER_URI = "http://localhost:3000"
# Visible to the Vue client
VUE_APP_SERVER_URI = "http://localhost:3000"

PORT = 3000

SPOTIFY_CLIENT_ID = ...
SPOTIFY_CLIENT_SECRET = ...

GOOGLE_CLIENT_ID = ...
GOOGLE_CLIENT_SECRECT = ...

FACEBOOK_CLIENT_ID = ...
FACEBOOK_CLIENT_SECRET = ...
```

An additional `.env.production` is required to specify the URI:s used in production.
