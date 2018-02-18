let sessionStore;

module.exports = {
    init(app, session, FileStore) {
        app.use(session({
            secret: 'spotify är sh1t, snoppify är bra!',
            resave: false,
            saveUninitialized: true,
            cookie: {
                secure: false
            },
            store: (sessionStore = new FileStore({
                ttl: 3600 * 24,
            })),
        }));

        app.use(function(req, res, next) {
            let ip = require('ip').address();

            res.header("Access-Control-Allow-Origin", `http://${ip}:3000`);
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.header("Access-Control-Allow-Credentials", "true");
            next();
        });

        /////////// ENDPOINTS

        app.post("/new-user", (req, res) => {
            if (!req.body.username) {
                res.sendStatus(400);
            } else {
                req.session.username = req.body.username;
                req.session.ip = req.ip;
                req.session.fingerprint = req.body.fp;

                console.log("New session:", req.session);

                res.send({
                    username: req.body.username,
                })
            }
        });

        app.get("/auth", (req, res) => {
            if (req.session && req.session.username) {
                req.session.ip = req.ip;
                req.session.fingerprint = req.query.fp;

                console.log("Returning user:", req.session)

                res.send({
                    username: req.session.username
                });
            } else {
                res.sendStatus(403);
            }
        })
    },
};