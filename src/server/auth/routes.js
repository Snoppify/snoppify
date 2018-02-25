const path = require('path');

module.exports = function(app, passport) {

    // route for home page
    // app.get('/', function(req, res) {
    //     res.render('index.ejs'); // load the index.ejs file
    // });

    // route for login form
    // route for processing the login form
    // route for signup form
    // route for processing the signup form

    // route for showing the profile page
    // app.get('/profile', isLoggedIn, function(req, res) {
    //     res.render('profile.ejs', {
    //         user: req.user // get the user out of session and pass to template
    //     });
    // });

    //     app.get("/new-user", redirectIfLoggedIn, (req, res) => {
    //         res.sendFile(path.resolve('public/index.html'));
    // });

    // app.get('*', isLoggedIn, function(req, res) {
    //         res.sendFile(path.resolve('public/index.html'));
    // });

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope: ['public_profile', 'email']
    }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/',
            failureRedirect: '/new-user'
        }));

    // route for logging out
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // app.get('/logout', function(req, res) {
    //     req.session.destroy(function(err) {
    //         res.redirect('/'); //Inside a callback… bulletproof!
    //     });
    // });

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/new-user');
}

function redirectIfLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return res.redirect('/');
    next();
}