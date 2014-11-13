var fs = require('fs'),
    passport = require('passport'),
    uid = require('uid'),
    cache = cache || fs.readFileSync('static/auth.html', 'utf-8');

function showAuthForm(storage) {
    return function (req, res) {
        var authCookie = req.cookies['auth_cookie'];
        storage.read('cookies:' + authCookie, function (err, _res) {
            if (_res !== 'true') {
                cache = cache || fs.readFileSync('static/auth.html', 'utf-8');

                res.send(cache);
            } else {
                storage.read('openBadges', function (err, _res) {
                    var openBagdes = JSON.parse(_res);

                    res.redirect(openBagdes.info.hasIssuer ? '/class' : '/issuer');
                });
            }
        });
    }
}

function checkAuth(admin, storage) {
    return function (req, res) {
        if (req.body.username !== admin.username || req.body.password !== admin.password) {
            res.status(400).end();
        } else {
            cookieId = uid(7) + '';
            res.cookie('auth_cookie', cookieId, { maxAge: 90000000000, httpOnly: true });

            storage.write('cookies:' + cookieId, 'true', function () {
                res.redirect('/');
            });
        }
    }
    //return passport.authenticate('local');
}

function signOut(storage) {
    return function (req, res) {
        var authCookie = req.cookies['auth_cookie'];
        storage.write('cookies:' + authCookie, 'false', function () {
            //req.logout()
            res.redirect('/auth');
        });
        /*storage.read('cookies', function (err, _res) {
            var cookies = JSON.parse(_res);
            cookies.splice(cookies.indexOf(authCookie), 1);
            storage.write('cookies', JSON.stringify(cookies), function () {
                req.logout();
                res.redirect('/auth');
            })
        });*/
    }
}

module.exports = {
    showAuthForm: showAuthForm,
    checkAuth: checkAuth,
    signOut: signOut
};
