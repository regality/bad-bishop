(function(window) {
  "use strict";

  var name;
  var opponent;
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

  function chatMsg(who, msg) {
    var conversation = $(".conversation");
    var html = $("<div/>");
    html.addClass("msg");
    html.append("<b>" + who + ":</b> " + msg + "<br/>");
    conversation.append(html);
    conversation.prop({ scrollTop: conversation.prop("scrollHeight") });
  }

  function drawBoard(chess, div, flipped) {
    var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    var squares = {};
    var sq, square, board, color, tmp;

    div = $(div);
    div.html('');
    flipped = Boolean(flipped);

    board = $('<div/>');
    board.addClass('chess');

    tmp = $("<div/>");
    tmp.addClass("index-corner");
    board.append(tmp);
    for (var i = 0; i < 8; ++i) {
      tmp = $("<div/>");
      tmp.addClass("index-letter");
      var l = ( flipped ? letters[7 - i] : letters[i]);
      tmp.text(l);
      board.append(tmp);
    }
    tmp = $("<div/>");
    tmp.addClass("index-corner");
    board.append(tmp);
    for (var i = 8; i > 0; --i) {
      tmp = $("<div/>");
      tmp.addClass("index-number");
      var n = ( flipped ? (9 - i) : i);
      tmp.text(n);
      board.append(tmp);
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
      tmp = $("<div/>");
      tmp.addClass("index-number");
      tmp.text(n);
      board.append(tmp);
    }
    tmp = $("<div/>");
    tmp.addClass("index-corner");
    board.append(tmp);
    for (var i = 0; i < 8; ++i) {
      tmp = $("<div/>");
      tmp.addClass("index-letter");
      var l = ( flipped ? letters[7 - i] : letters[i]);
      tmp.text(l);
      board.append(tmp);
    }
    tmp = $("<div/>");
    tmp.addClass("index-corner");
    board.append(tmp);

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
  }

  function _refreshInvites() {
    $.ajax({
      url: '/invites',
      success: function(data) {

        var challengeList = $(".challenge-list");
        challengeList.html('');

        if (data.length) {
          $(".players-waiting").show();
          $(".no-one-waiting").hide();
        } else {
          $(".players-waiting").hide();
          $(".no-one-waiting").show();
        }

        for (var i = 0; i < data.length; ++i) {
          var invite = data[i];
          var html =
            '<div class="challenge">' +
            '<button sid="' + invite.id + '" class="accept btn btn-warning">' +
            invite.name +
            '</button>' +
            '</div>';
          challengeList.append(html);
        }
      }
    });
  }

  var inviteTimer;
  function refreshInvites(stop) {
    if (stop) {
      return clearInterval(inviteTimer);
    }
    if (!inviteTimer) {
      _refreshInvites();
      inviteTimer = setInterval(_refreshInvites, 1000);
    }
  }

  function showStep(name) {
    $("#main > div").hide();
    $("#main #" + name).show();
    if (name == 'find-game') {
      refreshInvites();
    } else {
      refreshInvites(true);
    }
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

    $("button.accept").live('click', function() {
      socket.emit('accept', {
        name: name,
        inviteId: $(this).attr('sid')
      });
    });

    function htmlEntities(str) {
      return String(str).replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;');
    }

    $(".type input").keyup(function(e) {
      if (e.which === 13) {
        var $this = $(this);
        var msg = $this.val();
        socket.emit("chat", {
          msg: msg
        });
        chatMsg(name, htmlEntities(msg));
        $this.val("");
      }
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
      opponent = msg.name;
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
        $(".pgndata").html(chess.pgn({max_width: 5, newline_char: '<br/>'}));
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
      flash('<b>Opponent is a Sissy</b><br/><br/>Your opponent has abandoned the game.', 60000);
    });

    socket.on('chat', function(msg) {
      chatMsg(opponent, msg.msg);
    });

    socket.on('move', function(msg) {
      chess.move(msg);
      update();
    });

  });
})(window);
