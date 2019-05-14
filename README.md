# snoppify

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d35cacd7e21445479f1a1b838a4334c4)](https://app.codacy.com/app/mold/snoppify?utm_source=github.com&utm_medium=referral&utm_content=mold/snoppify&utm_campaign=Badge_Grade_Settings)

## Requirements
`npm`

## Installation and running
Serve the server with `node server/` which is then available at [http://localhost:3000](http://localhost:3000).

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
