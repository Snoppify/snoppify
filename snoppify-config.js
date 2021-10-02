module.exports = {
    // app client id
    client_id: "1e62943d6e7843afb48654f227fa06b4",
    // app client secret
    client_secret: "f01c555344e249d2895fbf73f6255290",
    // refresh token
    // refresh_token:
    //   "AQD2eNHYwSN5tjkkClxlrt4vL0HoCpeZ94peMeCIFcT8AKpegVIT2T8RzggY_ygw0chkvBnTZq1LNinmVxog4MOHnEQaFsgFvv62tWGucHsgVWetJ59XGonbcaBRhVW6Ktk",
    // spotify user
    // owner: "johnbrynte",
    // queue playlist
    // playlist: "4aqgvSm1kYgFcsfyfSjcjQ",
    // spotify auth
    spotifyAuth: {
        clientID: "1e62943d6e7843afb48654f227fa06b4", // your App ID
        clientSecret: "f01c555344e249d2895fbf73f6255290", // your App Secret
        // callbackURL: "http://localhost:3000/auth/spotify",
        callbackURL: "https://snoppify.com/auth/spotify",
        profileURL:
            "https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email",
        profileFields: ["id", "email", "name"], // For requesting permissions from Facebook API
    },
    // google auth
    googleAuth: {
        clientID: "753036895161-s4js5717669so22j1om84nndnmioo395.apps.googleusercontent.com",
        clientSecret: "PS2wtk-0S-VBgI90fn24_1K6",
        callbackURL: "https://snoppify.com/auth/google",
    },
    // facebook auth
    facebookAuth: {
        clientID: "441745129577205", // your App ID
        clientSecret: "2eb6de98b65a4f29b6e098932bab43dd", // your App Secret
        // callbackURL: "http://localhost:3000/auth/facebook",
        callbackURL: "https://snoppify.com/auth/facebook",
        profileURL:
            "https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email",
        profileFields: ["id", "email", "name"], // For requesting permissions from Facebook API
    },
};