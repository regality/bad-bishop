var Chess = require('chess.js').Chess
  , io = require('socket.io')
  , invites = {}
  , games = {}

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
  res.render('index', {title: 'Bad Bishop', invites: _invites});
}

exports.createInvite = createInvite;
exports.createGame = createGame;
exports.getGame = getGame;
exports.invites = invites;
exports.games = games;

