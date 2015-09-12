/*! app.js | Start the faye server. */

var http = require('http')
  , faye = require('faye')

var server = http.createServer()
  , bayeux = new faye.NodeAdapter({ mount: '/', timeout: 60 })

bayeux.attach(server);
server.listen(81, function() {
  var address = server.address();

  console.info('Bayeux server listening on %s port %d.', address.address, address.port);
});

server.on('error', function(err) {
  switch ( err.code ) {
    // silently discard known errors
    case 'EADDRINUSE':
      break;

    default:
      console.error(err);
      break;
  }
});

process.on('SIGINT', function() {
  server.close(function() {
    console.info('\rBayeux server is closed.');
  });
});
