var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    express = require('express'),
    serveStatic = require('serve-static'),
    bodyParser = require('body-parser'),
    formidable = require('formidable'),
    jws = require('jws'),
    request = require('request'),
    isPng = require('is-png'),
    OpenBadges = require('../../openbadges-issuer-api/lib/index'),
    utils = require('./utils'),
    badgeBEMJSON = require('./badge.bemjson');

function _checkRequest(url, callback) {
    request(url, function (err, response, req) {
        if (response.statusCode !== 200) {
            setTimeout(function () {
                console.log('Request to ' + url + ' --> ' + response.statusCode);
                _checkRequest(url, callback);
            }, 1000);
        } else {
            console.log('Request to ' + url + ' --> 200');
            callback();
        }
    });
}

function _createBadge(body, callback) {
    var badgeData = openBadges.createBadge({
        name: body.name,
        email: body.email
    });

    if (typeof badgeData !== 'object') {
        callback(badgeData);
        return;
    }

    _checkRequest(badgeData.verify.url, function () {
        var earnerUrl = 'http://localhost:3000/award?badge=';

        callback(typeof badgeData === 'object' ? earnerUrl + badgeData.uid : badgeData);
    });
}

var config = JSON.parse(fs.readFileSync('config/config.json')),
    HOST = config['gh-pages'],
    REPOSITORY = config.repository,
    SECRET = utils.getSecretKey('private-key.pem');

console.log('Initializing the Open Badges...');

var openBadges = new OpenBadges(HOST, REPOSITORY);

// Server
console.log('Starting a server...');

var app = express();

app.use(serveStatic(process.cwd()));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// issuer
app.get('/issuer', function (req, res) {
    var html = fs.readFileSync('forms/desktop.bundles/issuer/issuer.html', 'utf-8');

    res.send(!openBadges.hasIssuer ? html : 'The issuer already exists!');
});

app.post('/issuer', function (req, res, next) {
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        if (files.image.size === 0 || !isPng(fs.readFileSync(files.image.path))) {
            res.send('Bad image! PNG format is expected!');
            return;
        }

        var metadata = {
            name: fields.name,
            url: fields.url,
            description: fields.description,
            image: files.image.path,
            email: fields.email
        };

        openBadges.createIssuer(metadata);

        res.redirect('/class');
    });
});

// class
app.get('/class', function (req, res) {
    var html = fs.readFileSync('forms/desktop.bundles/class/class.html', 'utf-8');

    res.send(openBadges.hasIssuer ? html : 'Can not create classes without an issuer!');
});

app.post('/class', function (req, res, next) {
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        if (files.image.size === 0 || !isPng(fs.readFileSync(files.image.path))) {
            res.send('Bad image! PNG format is expected!');
            return;
        }

        var metadata = {
            badgeClass: fields.badgeClass,
            name: fields.name,
            description: fields.description,
            image: files.image.path,
            criteria: fields.criteria
        };

        var classData = openBadges.createClass(metadata);

        res.send(typeof classData === 'object' ? 'Ok!' : classData);
    });
});

// manual-awarding
app.get('/manual-awarding', function (req, res) {
    function getOptions(createdClasses) {
        var last = createdClasses[createdClasses.length - 1];
        return createdClasses.map(function (_class) {
            return {
                val: _class,
                text: _class.replace(/_/g, ' '),
                checked: last === _class ? true : false
            };
        });
    }

    var createdClasses = Object.keys(openBadges.createdClasses);
    if (!createdClasses.length) {
        res.send('Can not create badges without classes!');
        return;
    }

    var BEMHTML = require('../forms/desktop.bundles/badge/badge.bemhtml.js').BEMHTML,
        _badgeBEMJSON = utils.deepCopy(badgeBEMJSON);

    _badgeBEMJSON.content[1].content.splice(2, 0, {
        block: 'select',
        mods: { mode: 'radio', theme: 'normal', size: 'm' },
        name: 'name',
        options: getOptions(createdClasses)
    });

    var html = BEMHTML.apply(_badgeBEMJSON);

    res.send(html);
});

app.post('/manual-awarding', function (req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields) {
        _createBadge(fields, function (url) {
            res.send(url);
        });
    });
});

// award
app.get('/award', function (req, res) {
    var badge = req.query.badge,
        createdClasses = openBadges.createdClasses,
        url = '';

    for (var i in createdClasses) {
        if (createdClasses[i].indexOf(badge) > -1) {
            url = HOST + '/' + i + '/' + badge + '/' + badge + '.json';
            break;
        }
    }

    var BEMHTML = require('../forms/desktop.bundles/award/award.bemhtml.js').BEMHTML;

    var html = BEMHTML.apply({
        block: 'page',
        title: 'Award',
        scripts: [
            { elem: 'js', url: 'https://backpack.openbadges.org/issuer.js' }
        ],
        content:
        {
            tag: 'script',
            content: 'OpenBadges.issue_no_modal([\'' + url + '\'], function(err, suc) {});'
        }
    });

    res.send(html);
});

app.post('/award', function (req, res) {
    if (jws.verify(req.body.signature, SECRET)) {
        var payload = JSON.parse(jws.decode(req.body.signature).payload);

        _createBadge(payload, function (url) {
            res.send(url);
        });
    } else {
        res.send('Invalid secret key!');
    }
});

// main
app.get('/', function (req, res) {
    res.send(fs.readFileSync('forms/desktop.bundles/index/index.html', 'utf-8'));
});

app.listen(3000);
console.log('Server is listening on port 3000. Point your browser to http://localhost:3000/');