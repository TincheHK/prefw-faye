/*! app.js | Start the faye server. */

// note: daemonize
if ( process.argv.indexOf('--cron') > -1 ) {
  var spawn = require('child_process').spawn
    , argv = process.argv;

  // remove --cron option
  argv.splice(argv.indexOf('--cron'), 1);

  var child = spawn(argv.shift(), argv, {
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    detached: true
  });

  var tmId = setTimeout(function() {
    console.error('Timeout while starting server, killing process.');

    child.kill();
  }, 30000);

  child.on('message', function(message) {
    if ( message.close ) {
      this.disconnect();
    }

    if ( message.error ) {
      console.error('Cannot start bayeux server: %s', message.error);
    }

    if ( tmId ) {
      clearTimeout(tmId);
    }

    child.unref();
  });
}
else {
  var http = require('http')
    , faye = require('faye')

  var server = http.createServer()
    , bayeux = new faye.NodeAdapter({ mount: '/', timeout: 60 })

  bayeux.attach(server);
  server.listen(8080, function() {
    var address = server.address();

    console.info('Bayeux server listening on %s port %d.', address.address, address.port);

    process.send({ close: true });
  });

  server.on('error', function(err) {
    switch ( err.code ) {
      // silently discard known errors
      case 'EADDRINUSE':
        process.send({ close: true });
        break;

      case 'EACCES':
        process.send({ close: true, error: 'Permission denied to designated address.' });
        break;

      default:
        err.close = true;
        process.send(err);
        break;
    }
  });

  process.on('SIGINT', function() {
    server.close(function() {
      console.info('\rBayeux server is closed.');
    });
  });
}
