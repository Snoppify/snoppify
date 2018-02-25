const express = require('express');
const router = express.Router();
const path = require('path');

const isAuthenticated = function(req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler 
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects
    if (req.isAuthenticated())
        return next();
    // if the user is not authenticated then redirect him to the login page
    res.redirect('/');
}

module.exports = function(passport, spotify) {

    // Spotify refresh token end point
    router.get("/refresh-token", (req, res) => {
        let refreshToken = "";
        let p = new Promise(function(resolve, reject) {
            if (req.query.code && req.query.state == "auth") {
                spotify.playbackAPI.getRefreshToken(req.query.code)
                    .then(function(token) {
                        refreshToken = token;
                        resolve();
                    })
                    .catch(function(r) {
                        let e = [r.response.status, "(" + r.response.data.error + ")", r.response.data.error_description].join(" ");
                        console.log(e);
                        refreshToken = e;
                        resolve();
                    });
            } else {
                resolve();
            }
        }).then(function() {
            fs.readFile(__dirname + "/refresh-token.html", 'utf8', (err, data) => {
                let authUrl = spotify.playbackAPI.getAuthUrl();
                data = data.replace(/{authUrl}/g, authUrl);
                data = data.replace(/{refreshToken}/g, refreshToken);
                res.send(data);
            });
        });
    });

    function successHandler(res) {
        return r => res.sendStatus(200);
    }

    function errorHandler(res) {
        return r => {
            if (!r || !r.response) {
                console.log(r);
                let status = r && r.status ? r.status : 500;
                return res.status(status).send(r);
            }
            return res.status(r.response.status).send({
                error: r.response.statusText
            });
        };
    }

    router.post("/queue-track", (req, res) => {
        console.log(`soMeBodyY (user "${req.user.username}" waTNTS to UQUE a song!!!`, req.body.trackId);

        spotify.controller.queueTrack(req.user.username, req.body.trackId)
            .then(successHandler(res)).catch(errorHandler(res));
    });

    router.post("/dequeue-track", (req, res) => {
        spotify.controller.dequeueTrack(req.user.username, req.body.trackId)
            .then(successHandler(res)).catch(errorHandler(res));
    });

    router.post("/vote", (req, res) => {
        spotify.controller.vote(req.user.username, req.body.trackId)
            .then(successHandler(res)).catch(errorHandler(res));
    });

    router.post("/unvote", (req, res) => {
        spotify.controller.unvote(req.user.username, req.body.trackId)
            .then(successHandler(res)).catch(errorHandler(res));
    });

    router.post("/play", (req, res) => {
        spotify.controller.play(req.body.playlist)
            .then(successHandler(res)).catch(errorHandler(res));
    });

    router.post("/pause", (req, res) => {
        spotify.controller.pause()
            .then(successHandler(res)).catch(errorHandler(res));
    });

    router.post("/next", (req, res) => {
        spotify.controller.next()
            .then(successHandler(res)).catch(errorHandler(res));
    });

    router.post("/previous", (req, res) => {
        spotify.controller.previous()
            .then(successHandler(res)).catch(errorHandler(res));
    });

    router.post("/empty-playlist", (req, res) => {
        spotify.controller.emptyPlaylist()
            .then(successHandler(res)).catch(errorHandler(res));
    });

    router.post("/empty-queue", (req, res) => {
        spotify.controller.emptyQueue()
            .then(successHandler(res)).catch(errorHandler(res));
    });

    router.get("/get-queue", (req, res) => {
        res.json({
            data: spotify.controller.getQueue()
        });
    });

    router.get("/info", (req, res) => {
        res.json({
            queue: spotify.controller.getQueue(),
            currentTrack: spotify.controller.getCurrentTrack(),
        })
    });

    router.get("/auth", (req, res) => {
        // if user is authenticated in the session, carry on
        if (req.isAuthenticated() && req.user) {
            res.json({
                id: req.user.id,
                username: req.user.username,
                name: req.user.name,
            });
            res.end();
        } else {
            res.sendStatus(403);
        }
    });

    router.get('/new-user', isAuthenticated, function(req, res) {
        res.sendFile(path.resolve('public/index.html'));
    });

    /* GET login page. */
    // router.get(['/', '/index.html'], isAuthenticated, function(req, res) {
    //     res.sendFile(path.resolve('public/index.html'));
    // });

    /* Handle Logout */
    router.get('/logout', function(req, res) {
        // req.logout();
        // res.redirect('/');
        req.session.destroy(function(err) {
            res.redirect('/'); //Inside a callback… bulletproof!
        });
    });

    //////// auth /////////

    // route for facebook authentication and login
    // different scopes while logging in
    router.get('/auth/facebook',
        passport.authenticate('facebook', {
            scope: ['public_profile', 'email']
        })
    );

    // handle the callback after facebook has authenticated the user
    router.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/',
            failureRedirect: '/new-user'
        })
    );

    return router;
}