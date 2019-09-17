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

A `snoppify-config.js` config file is required for the server to communicate with the spotify api, on the form

```
module.exports = {
    // app client id
    client_id: "aedf9876aedf897ea6df9ae8f6",
    // app client secret
    client_secret: "ea87df68aedf87ae6f98aef6ef",
    // refresh token
    refresh_token: "",
    // spotify user
    owner: "user",
    // queue playlist
    playlist: "07hQDH_MDAHSdmh7a8s-DHA_S",
};
```

The refresh token can be retrieved by going to [http://localhost:3000/refresh-token](http://localhost:3000/refresh-token) and following the instructions. Your spotify app must define `http://localhost:3000/refresh-token` in the 'Redirect URIs' option.

The environment variable `SERVER_IP` also needs to be set, with the local IP address of the serving computer (maybe).
