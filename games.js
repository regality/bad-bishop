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

exports.createInvite = createInvite;
exports.createGame = createGame;
exports.getGame = getGame;
exports.invites = invites;
exports.games = games;

