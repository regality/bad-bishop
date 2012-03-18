
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , Chess = require('chess.js').Chess
  , io = require('socket.io')
  , invites = {}
  , games = {}

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

function createInvite(name, socket) {
  invites[socket.id] = {
    name: name,
    socket: socket
  };
}

function createGame(nameW, nameB, socketW, socketB) {
  var game = {
    socketW: socketW,
    socketB: socketB,
    nameW: nameW,
    nameB: nameB,
  };
  games[socketW.id] = game;
  games[socketB.id] = game;
}

function getGame(id) {
  return games[id];
}

function listInvites(req, res) {
  var _invites = null;
  for (var i in invites) {
    if (invites.hasOwnProperty(i)) {
      _invites = invites
      break;
    }
  }
  res.render('index', {title: 'Chess', invites: _invites});
}

app.get('/', listInvites);

//Setup Socket.IO
var io = io.listen(app);
io.set('log level', 1);

io.sockets.on('connection', function(socket) {

  socket.on('invite', function(msg) {
    createInvite(msg.name, socket);
  });

  socket.on('accept', function(msg) {
    var invite = invites[msg.inviteId];
    createGame(msg.name, invite.name, socket, invite.socket);
    delete invites[msg.inviteId];
    var color1 = (Math.floor(Math.random() + 0.5) ? 'black' : 'white');
    var color2 = (color1 === 'white' ? 'black' : 'white');
    socket.emit('start', {
      color: color1,
      name: invite.name
    });
    invite.socket.emit('start', {
      color: color2,
      name: msg.name
    });
  });

  socket.on('move', function(msg) {
    var game = getGame(socket.id);
    if (!game) return;
    if (game.socketW === socket) {
      game.socketB.emit('move', msg);
    } else {
      game.socketW.emit('move', msg);
    }
  });

  socket.on('disconnect', function() {
    var game = getGame(socket.id);
    if (game) {
      if (game.socketW === socket) {
        game.socketB.emit('abandon', {});
      } else {
        game.socketW.emit('abandon', {});
      }
      delete games[game.socketW.id];
      delete games[game.socketB.id];
    }
    if (invites[socket.id]) {
      delete invites[socket.id];
    }
  });
});


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
