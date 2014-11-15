var path = require('path'),
    serveStatic = require('serve-static'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    passport = require('passport'),
    uid = require('uid'),
    controllers = require('./controllers');

var cookieParser = require('cookie-parser')

module.exports = function (app, openBadges, storage, admin) {
    app
        .use(function(req, res, next){
            req._uid = uid(12)
            process.log('[%s] processing request %s', req._uid, req.url)
            next()
        })
        .use(serveStatic(path.join(process.cwd(), 'static')))

        .use(bodyParser.urlencoded({ extended: false }))
        .use(bodyParser.json())

        //.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true }))
        //.use(passport.initialize())
        //.use(passport.session())
        app.use(cookieParser())

        .use(['/issuer', '/class', '/manual-awarding'], controllers.check.isAuthenticated(storage))

        .get('/auth', controllers.auth.showAuthForm(storage))
        .get('/sign-out', controllers.auth.signOut(storage))
        .get('/', controllers.index(storage))
        .get('/issuer', controllers.issuer.showIssuerForm(storage))
        .get('/class', controllers.klass.showClassForm(storage))
        .get('/manual-awarding', controllers.badge.showManualAwarfingForm(storage))

        /*.post('/auth', controllers.auth.checkAuth(admin), function (req, res) {
            storage.read('cookies', function (err, _res) {
                var cookies = JSON.parse(_res),
                    cookieId = uid(7) + '';

                res.cookie('auth_cookie', cookieId, { maxAge: 90000000000, httpOnly: true });

                cookies.push(cookieId);

                storage.write('cookies', JSON.stringify(cookies), function () {
                    res.redirect('/');
                })
            });
        })*/
        .post('/auth', controllers.auth.checkAuth(admin, storage))
        .post('/issuer', controllers.issuer.createIssuer(openBadges, storage))
        .post('/class', controllers.klass.createClass(openBadges, storage))
        .post('/manual-awarding', controllers.badge.awardBadgeManually(openBadges, storage))
        .post('/awarding', controllers.badge.awardBadge(openBadges, storage))
        .post('/check-class-existence', controllers.check.classExistence(storage))

        .get('/openBadges', function (req, res) {
            storage.read('openBadges', function (err, _res) {
                var _openBadges = JSON.parse(_res);
                res.send(JSON.stringify(_openBadges, null, '  '));
            });
        })

        .get('/info', function (req, res) {
            res.send(JSON.stringify(openBadges, null, '  '));
        });

    //passport.use('local', controllers.pass.createLocalStrategy(admin));
    //passport.serializeUser(controllers.pass.serializeUser);
    //passport.deserializeUser(controllers.pass.deserializeUser);
};
