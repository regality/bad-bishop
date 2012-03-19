var express = require('express')
  , games = require('./games')

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

function listInvites(req, res) {
  var _invites = null;
  for (var i in games.invites) {
    if (games.invites.hasOwnProperty(i)) {
      _invites = games.invites
      break;
    }
  }
  res.render('index', {title: 'Bad Bishop', invites: _invites});
}

app.get('/', listInvites);

var port = process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);

require('./io');
