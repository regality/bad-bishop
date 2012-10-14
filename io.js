//Setup Socket.IO
var app = require('./app')
  , io = require('socket.io')
  , io = io.listen(app)
  , games = require('./games');


io.configure(function () {
  var transports = [
    'websocket',
    'xhr-polling',
    'jsonp-polling',
    'htmlfile'
  ];
  io.set('log level', 1);
  io.set('transports', transports);
  io.set('polling duration', 5);
});

function invite(socket, msg) {
  games.createInvite(msg.name, socket);
}

function accept(socket, msg) {
  var invite = games.invites[msg.inviteId];
  games.createGame(msg.name, invite.name,
                   socket, invite.socket);
  delete games.invites[msg.inviteId];
  var color1 = ( Math.floor(Math.random() + 0.5)
               ? 'black' : 'white');
  var color2 = (color1 === 'white' ? 'black' : 'white');
  socket.emit('start', {
    color: color1,
    name: invite.name
  });
  invite.socket.emit('start', {
    color: color2,
    name: msg.name
  });
}

function forward(socket, event, msg) {
  var game = games.getGame(socket.id);
  if (!game) return;
  if (game.socketW === socket) {
    game.socketB.emit(event, msg);
  } else {
    game.socketW.emit(event, msg);
  }
}

function disconnect(socket, msg) {
  var game = games.getGame(socket.id);
  if (game) {
    if (game.socketW === socket) {
      game.socketB.emit('abandon', {});
    } else {
      game.socketW.emit('abandon', {});
    }
    delete games.games[game.socketW.id];
    delete games.games[game.socketB.id];
  }
  if (games.invites[socket.id]) {
    delete games.invites[socket.id];
  }
}

function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
}

io.sockets.on('connection', function(socket) {

  socket.on('invite', function(msg) {
    invite(socket, msg);
  });

  socket.on('accept', function(msg) {
    accept(socket, msg);
  });

  socket.on('move', function(msg) {
    forward(socket, 'move', msg);
  });

  socket.on('chat', function(msg) {
    msg.msg = htmlEntities(msg.msg);
    forward(socket, 'chat', msg);
  });

  socket.on('disconnect', function(msg) {
    disconnect(socket, msg);
  });

});

