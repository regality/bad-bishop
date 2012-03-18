(function(window) {
  "use strict";

  var name;
  var color;
  var chess;
  var update = function(){};

  window.chess = chess;

  function flash(html, time) {
    var msg = $("<div/>");
    msg.addClass("well")
       .addClass("flash")
       .addClass("alert")
    msg.html(html);
    $(".chess").append(msg);
    var timer = setTimeout(function() {
      msg.remove();
    }, time);
    msg.click(function() {
      clearTimeout(timer);
      $(this).remove();
    });
  }

  function drawBoard(chess, div, flipped) {
    var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    var squares = {};
    var sq, square, board, color;

    div = $(div);
    div.html('');
    flipped = Boolean(flipped);

    board = $('<div/>');
    board.addClass('chess');
    for (var i = 8; i > 0; --i) {
      for (var l = 0; l < 8; ++l) {
        sq = ( flipped
             ? letters[7 - l] + (9 - i)
             : letters[l] + i);
        color = chess.square_color(sq);
        square = $('<div/>');
        square.addClass('square');
        square.addClass(color);
        square.attr("sq", sq);
        squares[sq] = square;
        board.append(square);
      }
    }
    div.append(board);

    function getImage(piece) {
      var name = piece.color;
      switch (piece.type) {
        case 'p': name += 'pawn'  ; break;
        case 'b': name += 'bishop'; break;
        case 'n': name += 'knight'; break;
        case 'r': name += 'rook'  ; break;
        case 'q': name += 'queen' ; break;
        case 'k': name += 'king'  ; break;
      }
      name = '/images/pieces/' + name + '.png';
      var img = $("<img/>")
      img.attr('src', name);
      img.attr('piece', piece.color + piece.type);
      return img;
    }

    function updateBoard() {
      var sq, square, piece, tmp;
      for (var i = 8; i > 0; --i) {
        for (var l = 0; l < 8; ++l) {
          sq = letters[l] + i;
          square = squares[sq];
          piece = chess.get(sq);
          tmp = square.find('img');
          if (piece && tmp && tmp.attr('piece') === (piece.color + piece.type)) {
            // do nothing
          } else if (piece) {
            tmp.remove();
            square.append(getImage(piece));
          } else {
            square.html('');
          }
        }
      }
    }

    updateBoard();
    return updateBoard;
  };

  function showStep(name) {
    $("#main > div").hide();
    $("#main #" + name).show();
  }

  $(document).ready(function() {
    var socket = io.connect();

    var cookies = document.cookie.split(";").map(function(v){return v.split("=",2)})

    cookies.forEach(function(v) {
      if (v[0] === 'name') {
        name = v[1];
        $("h2.welcome").text("Welcome, " + name);
        showStep("find-game");
      }
    });

    $("input[name=name]").focus();

    $("#setname").click(function() {
      name = $("input[name=name]").val();
      if (name) {
        if (document.cookie) {
          document.cookie += ";";
        }
        document.cookie += "name=" + name;
        $("h2.welcome").text("Welcome, " + name);
        showStep("find-game");
      }
    });

    $("#invite").click(function() {
      socket.emit('invite', {name: name})
      showStep("waiting");
    });

    $("button.accept").click(function() {
      socket.emit('accept', {
        name: name,
        inviteId: $(this).attr('sid')
      });
    });

    var from = null;
    $(".square").live('click', function() {
      var $this = $(this);
      if (chess.turn() === color) {
        var sq = $this.attr('sq');
        var c = chess.get(sq);
        c = (c !== null ? c.color : false);
        if (from === null && color === c && !chess.game_over()) {
          $this.addClass("hl");
          from = $this;
        } else if (from) {
          $(".square").removeClass("hl");
          var move = {
            from: from.attr('sq'),
            to: $this.attr('sq'),
            promotion: 'q'
          };
          var move = chess.move(move);
          if (move) {
            socket.emit("move", move);
            update();
          }
          from = null;
        }
      }
    });

    socket.on('start', function(msg) {
      chess = new Chess();
      color = msg.color.substr(0, 1);
      var yourColor = msg.color;
      var theirColor = (yourColor === "white" ? "black" : "white");
      $(".otherguy").text(theirColor + ": " + msg.name);
      $(".you").text(yourColor + ": " + name);
      var boardUpdate = drawBoard(chess, ".board", (yourColor === "black"));
      update = function() {
        boardUpdate();
        if (chess.turn() === color) {
          $(".you").addClass("yourturn");
          $(".otherguy").removeClass("yourturn");
        } else {
          $(".you").removeClass("yourturn");
          $(".otherguy").addClass("yourturn");
        }
        $(".pgn").html(chess.pgn({max_width: 5, newline_char: '<br/>'}));
        if (chess.game_over()) {
          var reason = '';
          if (chess.in_checkmate()) {
            reason = '<b>Checkmate</b><br/>'
            if (chess.turn() === color) {
              reason += "You lose.";
            } else {
              reason += "You win!";
            }
            flash(reason, 10000);
          } else if (chess.in_draw()) {
            flash('<b>Game Over</b><br/>Game is a draw.', 10000);
          } else if (chess.in_stalemate()) {
            flash('<b>Game Over</b><br/>Game is a stalemate.', 10000);
          } else {
            flash('<b>Game Over</b>', 10000);
          }
        } else if (chess.in_check() && chess.turn() === color) {
          flash('<b>Check!</b><br/>You are in check.', 2000);
        }
      };
      update();
      showStep("play-game");
    });

    socket.on("abandon", function(msg) {
      flash('<b>Opponent is a Sissy</b><br/>Your opponent has abandoned the game.', 60000);
    });

    socket.on('move', function(msg) {
      chess.move(msg);
      update();
    });

  });
})(window);
