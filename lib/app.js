var fs = require('fs'),
    argv = require('optimist').argv,
    cocaine = require('cocaine'),
    http = cocaine.spawnedBy() ? cocaine.http : require('http'),
    app = require('express')(),
    server = http.createServer(app),
    Storage = require('./storage/Storage'),
    port = process.env.PORT || 3000;


var OpenBadges = require('./issuer'),
    utils = require('./utils');

var rawConfig = JSON.parse(fs.readFileSync('config/config.json')),
    badgesStorageConfig = utils.getBadgesStorageConfig(rawConfig.badgesStorage),
    admin = rawConfig.admin;

init()

function init(cb){

    process.storage = new Storage({ locator: argv.locator, namespace: 'OpenBadges', debug: true });
    process.log = function(){
        process.storage._log.apply(process.storage, arguments)
    }

    process.storage.connect();
    process.storage.once('connect', function(){

        process.log('initializing OpenBadges...')

        OpenBadges.initialize(badgesStorageConfig)
            .then(function (openBadges) {
                process.log('OpenBadges initialized');
                process.log(JSON.stringify(openBadges, null, '  '));

                process.storage.write('openBadges', JSON.stringify(openBadges), function (err) {
                    require('./server')(app, openBadges, process.storage, admin);

                    if (cocaine.spawnedBy()) {
                        var W = new cocaine.Worker(argv),
                        handle = W.getListenHandle('http');

                        server.listen(handle, function () {
                            process.log('listening on cocaine handle');
                        });
                    } else {
                        server.listen(port, function () {
                            process.log('Server is listening on port ' + port);
                        });
                    }
                });

            })
            .fail(function (err) {
                process.log('OpenBadges initialization fail', err);
            });


        
    })
}



