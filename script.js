const boardWidth = 8;
const boardHeight = 8;
const DEPTH = 8;
const PLAYER = -1;

const board = [
  0, 1, 0, 1, 0, 1, 0, 1,
  1, 0, 1, 0, 1, 0, 1, 0,
  0, 1, 0, 1, 0, 1, 0, 1,
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
  -1, 0, -1, 0, -1, 0, -1, 0,
  0, -1, 0, -1, 0, -1, 0, -1,
  -1, 0, -1, 0, -1, 0, -1, 0
]

const cells = [];

const game = new Board(board, true);

let selected = null;
game.initialiseBoard();


function Board(board, blackToPlay) {
  this.board = board;
  this.blackToPlay = blackToPlay;
  this.blackCount = 12;
  this.redCount = 12;
  this.moveCount = 0;

  this.sq2Idx = function(r0, c0) {
    return r0 * 8 + c0;
  }

  this.idx2Sq = function(i0) {
    return [Math.floor(i0 / 8), i0 % 8];
  }

  this.initialiseBoard = function() {
    const table = document.getElementsByClassName("board")[0];
    table.innerHTML = "";
  
    for (let i = 0; i < boardHeight; i++) {
      const row = document.createElement("tr");
      for (let j = 0; j < boardWidth; j++) {
          const ele = document.createElement("td");
          if ((i + j) % 2 == 0){
            ele.setAttribute("class", "noPiece");
          } else {
            const piece = document.createElement("p");
            const idx = this.sq2Idx(i, j);
            let pieceType;
            if (this.board[idx] == 1) {
              pieceType = "red";
            } else if (this.board[idx] == -1) {
              pieceType = "black";
            } else if (this.board[idx] == 2) {
              pieceType = "red king"
            } else if (this.board[idx] == -2) {
              pieceType = "black king"
            } else {
              pieceType = "empty";
            }
            piece.setAttribute("class", pieceType);
            ele.appendChild(piece);
            ele.onclick = function() {

              const row = parseInt(this.getAttribute("row"));
              const col = parseInt(this.getAttribute("col"));

              if (selected && game.sideToPlay() == PLAYER) {
                cell = cells[row * 8 + col];
                if (cell.children[0].getAttribute("class") == "empty") {
                  const r0 = parseInt(selected.getAttribute("row"));
                  const c0 = parseInt(selected.getAttribute("col"));
                  const moves = game.getMoves(r0, c0);
                  if (moves.length > 0) {
                    const checkMove = function(move) {
                      if (Array.isArray(move.at(-1))) {
                        move = move.at(-1);
                      }
                      const r1 = move[2];
                      const c1 = move[3];
                      let moved = false;
                      if (r1 == row && c1 == col){
                        moved = true;
                      }
                      cell.setAttribute("id", "selected");
                      return moved;
                    }
                    
                    let moved = false;
                    for (let i = 0; i < moves.length; i++) {
                      let move = moves[i];
                      if (checkMove(move)) {
                        moved = true;
                        game.makeMove(move);
                      }
                    }
                    

                    if (moved) {
                      game.toggleSide();
                      const redTurn = document.getElementById('red-turn');
                      const blackTurn = document.getElementById('black-turn');
                      if (game.blackToPlay) {
                        redTurn.removeAttribute("class");
                        blackTurn.setAttribute("class", "toMove");
                      } else {
                        blackTurn.removeAttribute("class");
                        redTurn.setAttribute("class", "toMove");
                      }

                      game.showMove();
                    
                      let won = false;
                      setTimeout(() => {if (game.isTerminalState()) {
                        alert("Player has won");
                        won = true;
                      }}, 50);
                      if (won) {
                        return;
                      }
                      

                      let bestMove = null;
                      setTimeout(() => {
                        bestMove = game.search();
                        game.makeMove(bestMove);
                        game.toggleSide();
                        game.showMove();

                        const redTurn = document.getElementById('red-turn');
                        const blackTurn = document.getElementById('black-turn');
                        if (game.blackToPlay) {
                          redTurn.removeAttribute("class");
                          blackTurn.setAttribute("class", "toMove");
                        } else {
                          blackTurn.removeAttribute("class");
                          redTurn.setAttribute("class", "toMove");
                        }
                      }, 50);
                    
                      if (game.isTerminalState()) {
                        alert("Computer has won");
                        won = true;
                        return;
                      }
                      if (won) {
                        return;
                      }
                    }
                  }
                }
              };

              for (let i = 0; i < cells.length; i++) {
                let cell = cells[i];
                cell.removeAttribute("id");
              }
              
              const moves = game.getMoves(row, col);
              if (moves.length > 0 && game.sideToPlay() == PLAYER){

                const displayMoves = function(move) {
                  const r1 = move[2];
                  const c1 = move[3];
                  const cell = cells[r1 * 8 + c1];
                  cell.setAttribute("id", "selected");
                }

                for (let i = 0; i < moves.length; i++) {
                  let move = moves[i];
                  if (Array.isArray(move[0])){
                    for (let i = 0; i < move.length; i++) {
                      let m = move[i];
                      displayMoves(m);
                    }
                  } else {
                  displayMoves(move);
                  }
                }
              }

              selected = cells[row * 8 + col];
            };
            
          }
          ele.setAttribute("row", i);
          ele.setAttribute("col", j);
          row.appendChild(ele);
          cells.push(ele);
      }
    table.appendChild(row);
    }
  }

  this.inBounds = function(row, col) {
    if (row < 0 || row > boardWidth-1 || col < 0 || col > boardWidth-1){
      return false;
    }
    return true;
  }

  this.sideToPlay = function() {
    return this.blackToPlay ? -1 : 1;
  }

  this.piece = function(r0, c0){
    return this.board[this.sq2Idx(r0, c0)];
  }

  this.canPlay = function(r0, c0) {
    const piece = this.piece(r0, c0);
    if (piece < 0 && this.sideToPlay() == -1) {
      return true;
    }
    if (piece > 0 && this.sideToPlay() == 1) {
      return true;
    }
    return false;
  }

  this.makePush = function(r0, c0, r1, c1, capture, promotion) {
    const i0 = this.sq2Idx(r0, c0);
    const i1 = this.sq2Idx(r1, c1);
    const piece = parseInt(this.board[i0]);
    if (promotion && piece == -1) {
      this.board[i1] = -2;
    } else if (promotion && piece == 1) {
      this.board[i1] = 2;
    } else {
      this.board[i1] = piece;
    }
    this.board[i0] = 0;

    if (capture != 0) {
      if (capture > 0) {
        this.redCount -= 1;
      } else if (capture < 0) {
        this.blackCount -= 1;
      }
      this.board[this.sq2Idx((r0+r1)/2, (c0+c1)/2)] = 0;
    }
  }

  this.undoPush = function(r0, c0, r1, c1, capture, promotion) {
    const i0 = this.sq2Idx(r0, c0);
    const i1 = this.sq2Idx(r1, c1);
    const piece = parseInt(this.board[i1]);
    if (promotion && piece == -2) {
      this.board[i0] = -1;
    } else if (promotion && piece == 2) {
      this.board[i0] = 1;
    } else {
      this.board[i0] = piece;
    }
    this.board[i1] = 0;

    if (capture != 0) {
      if (capture > 0) {
        this.redCount += 1;
      } else if (capture < 0) {
        this.blackCount += 1;
      }
      this.board[this.sq2Idx((r0+r1)/2, (c0+c1)/2)] = capture;
    }
  }

  this.makeJump = function(moves) {
    for (let i = 0; i < moves.length; i++) {
      let move = moves[i];
      this.makePush(...move);
    }
  }

  this.undoJump = function(moves) {
    for (let i = moves.length - 1; i >= 0; i--) {
      let move = moves[i];
      this.undoPush(...move);

    }
  }

  this.makeMove = function(move) {
    const isJump = Array.isArray(move.at(-1));
    if (isJump) {
      this.makeJump(move);
    } else {
      this.makePush(...move);
    }
  }

  this.undoMove = function(move) {
    const isJump = Array.isArray(move.at(-1));
    if (isJump) {
      this.undoJump(move);
    } else {
      this.undoPush(...move);
    }
  }

  this.isTerminalState = function() {
    return this.redCount == 0 || this.blackCount == 0;
  }

  this.getSteps = function (r0, c0) {
    if (!this.canPlay(r0, c0)){
      return null;
    }
    switch (this.piece(r0, c0)) {
      case 1:
        return [[1, 1], [1, -1]];
      case -1:
        return [[-1, 1], [-1, -1]];
      case 2:
        return [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      case -2:
        return [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    }
  }

  this.getPush = function(r0, c0) {
    const moves = [];
    const steps = this.getSteps(r0, c0);
    if (steps) {
      for (let i = 0; i < steps.length; i++) {
        let [dr, dc] = steps[i];
        const r1 = r0 + dr;
        const c1 = c0 + dc;
        if (this.inBounds(r1, c1) && this.piece(r1, c1) == 0) {
          moves.push([r0, c0, r1, c1, 0, this.isPromotion(r0, c0, r1)]);
        }
      }
    }
    return moves;
  }

  this.toggleSide = function() {
    this.blackToPlay = !this.blackToPlay;
  }

  this.isPromotion = function(r0, c0, r1) {
    const piece = this.piece(r0, c0);
    if (piece == -1 && r1 == 0) {
      return true;
    }
    if (piece == 1 && r1 == boardHeight - 1) {
      return true;
    }
    return false;
  }

  this.getJump = function(r0, c0, prevMoves=[]) {
    let moves = [];
    const steps = this.getSteps(r0, c0);
    if (steps) {
      for (let i = 0; i < steps.length; i++) {
        let [dr, dc] = steps[i];
        const capR = r0 + dr;
        const capC = c0 + dc;
        if (this.inBounds(capR, capC) && this.piece(capR, capC) != 0 && !this.canPlay(capR, capC)) {
          const r1 = r0 + 2 * dr;
          const c1 = c0 + 2 * dc;
          if (this.inBounds(r1, c1) && this.piece(r1, c1) == 0) {
            let move = [r0, c0, r1, c1, this.piece(capR, capC), this.isPromotion(r0, c0, r1)];
            prevMoves.push(move);
            moves.push(Array.from(prevMoves));
            this.makeMove(move);
            const jumps = this.getJump(r1, c1, prevMoves);
            this.undoMove(move);
            prevMoves.pop();
            if (jumps.length > 0) moves = moves.concat(jumps);
          }
        }
      }
    }
    return moves;
  }

  this.getMoves = function(r0, c0) {
    const pushes = this.getPush(r0, c0);
    const jumps = this.getJump(r0, c0);
    return jumps.concat(pushes);
  }

  this.getBoardMoves = function() {
    let moves = [];
    for (let i = 0; i < boardHeight; i++) {
      for (let j = 0; j < boardWidth; j++) {
        moves = moves.concat(this.getMoves(i, j));
      }
    }
    return moves
  }

  this.showMove = function() {
    for (let i = 0; i < boardHeight; i++){
      for (let j = 0; j < boardWidth; j++) {
        const piece = this.board[this.sq2Idx(i, j)];
        const cell = cells[this.sq2Idx(i, j)];
        let pieceType;
        if (piece == 1) {
          pieceType = "red";
        } else if (piece == -1) {
          pieceType = "black";
        } else if (piece == 2) {
          pieceType = "red king"
        } else if (piece == -2) {
          pieceType = "black king"
        } else {
          pieceType = "empty";
        }
        if (cell.hasChildNodes()) {
          cell.children[0].setAttribute("class", pieceType);
        }
      }
    }
  }

  this.eval = function() {
    let score = 0;
    for (let i = 0; i < boardHeight; i++) {
      for (let j = 0; j < boardWidth; j++) {
        const piece = this.board[this.sq2Idx(i, j)];
        switch (piece) {
            case 1: score += 2 + 0.0375 * i; break;
            case 2: score += 3; break;
            case -1: score -= 2 + 0.0375 * (7-i); break;
            case -2: score -= 3; break;
          }
      }
    }

    return this.blackToPlay ? - score : score;
  }

  this.negamax = function(alpha, beta, depth) {
    this.moveCount += 1;
    if (depth == 0) {
      return this.eval();
    }
    const moves = this.getBoardMoves();
    if (this.isTerminalState()) {
      const score = 900 + depth;
      return this.blackToPlay ? -score : score;
    }
    if (moves.length == 0) {
      const score = 900 + depth;
      return this.blackToPlay ? score : -score;
    }
    let score = -9999;
    
    if (moves) {
      for (let i = 0; i < moves.length; i++) {
        let move = moves[i];
        this.makeMove(move);
        this.toggleSide();
        score = Math.max(score, -this.negamax(-beta, -alpha, depth-1));
        this.toggleSide();
        this.undoMove(move);
        alpha = Math.max(alpha, score);
        if (alpha >= beta) {
          break;
        }
      }
      return score;
    }
  }

  this.search = function() {
    let bestMove = null;
    let bestScore = -9999;
    const moves = this.getBoardMoves();
    this.moveCount = 0;
    if (moves) {
      for (let i = 0; i < moves.length; i++) {
        this.moveCount += 1;
        let move = moves[i];
        this.makeMove(move);
        this.toggleSide();
        score = -this.negamax(-9999, 9999, DEPTH);
        this.toggleSide();
        this.undoMove(move);
        if (score > bestScore){
          bestScore = score;
          bestMove = move;
        }
        console.log(move, score);
      }
    }
    console.log(this.moveCount);
    return bestMove;
  }
}


