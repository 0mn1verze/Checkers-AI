from copy import deepcopy

STARTPOS = [[' ', 'b', ' ', 'b', ' ', 'b', ' ', 'b'],
            ['b', ' ', 'b', ' ', 'b', ' ', 'b', ' '],
            [' ', 'b', ' ', 'b', ' ', 'b', ' ', 'b'],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            ['w', ' ', 'w', ' ', 'w', ' ', 'w', ' '],
            [' ', 'w', ' ', 'w', ' ', 'w', ' ', 'w'],
            ['w', ' ', 'w', ' ', 'w', ' ', 'w', ' '],
            ]

DEPTH = 3
FORCE_JUMP = False
MAX_SEARCH_TIME = 5


class Move:
    def __init__(self, r0, c0, r1, c1, capture, promotion, capPiece=' '):
        self.r0: int = r0
        self.c0: int = c0
        self.r1: int = r1
        self.c1: int = c1
        self.capture: bool = capture
        self.promotion: bool = promotion
        self.capPiece: str = capPiece
        self.capR = None
        self.capC = None
        if self.capture:
            self.capR: int = (r0+r1)//2
            self.capC: int = (c0+c1)//2

    def __eq__(self, m):
        if isinstance(m, list):
            return False
        return m.r0 == self.r0 and m.c0 == self.c0 and m.r1 == self.r1 and m.c1 == self.c1 and m.capture == self.capture and m.promotion == self.promotion and m.capR == self.capR and m.capC == self.capC and m.capPiece == self.capPiece

    def __repr__(self):
        return f"{self.r0}{self.c0}{'x' if self.capture else '-'}{self.r1}{self.c1}"


class Board:
    def __init__(self, board=STARTPOS, blackToPlay=False):
        self.board = board
        self.blackToPlay = blackToPlay
        self.pvLine = [None] * DEPTH

    def inBound(self, r, c):
        if r < 0 or r > 7 or c < 0 or c > 7:
            return False
        return True

    def sideToPlay(self):
        return 'b' if self.blackToPlay else 'w'

    def hasPromoted(self, r, piece):
        if self.sideToPlay() == 'b' and piece == "b" and r == 7:
            return True
        if self.sideToPlay() == 'w' and piece == "w" and r == 0:
            return True
        return False

    def makeMove(self, m: Move):
        if m.promotion:
            self.board[m.r0][m.c0], self.board[m.r1][m.c1] = ' ', self.board[m.r0][m.c0].upper()
        else:
            self.board[m.r0][m.c0], self.board[m.r1][m.c1] = ' ', self.board[m.r0][m.c0]
        if not m.capture:
            return
        self.board[m.capR][m.capC] = ' '

    def makeJump(self, l):
        for m in l:
            self.makeMove(m)

    def isTerminalState(self):
        whiteSeen = False
        blackSeen = False
        for i in range(8):
            for j in range(8):
                if self.board[i][j] in 'wW':
                    whiteSeen = True
                if self.board[i][j] in 'bB':
                    blackSeen = True
        return len([*self.getMoves()]) == 0 or not blackSeen or not whiteSeen

    def print(self):
        print('\n'.join([f'{i} '+' '.join(row)
              for i, row in enumerate(self.board)]+['  '+' '.join(map(str, range(8)))]))

    def getMoves(self):
        def getStep(r0, c0, board=self):
            if board.board[r0][c0].lower() != board.sideToPlay():
                return []
            match board.board[r0][c0]:
                case 'b':
                    return (1, 1), (1, -1)
                case 'w':
                    return (-1, 1), (-1, -1)
                case ' ':
                    return []
                case _:
                    return (1, 1), (1, -1), (-1, 1), (-1, -1)

        def getPush(r0, c0):
            for dr, dc in getStep(r0, c0):
                r1, c1 = r0 + dr, c0 + dc
                if not self.inBound(r1, c1) or self.board[r1][c1] != ' ':
                    continue
                promoted = self.hasPromoted(r1, self.board[r0][c0])
                yield Move(r0, c0, r1, c1, False, promoted)

        def getJump(board, r0, c0, moves=[]):
            for dr, dc in getStep(r0, c0, board):
                capR, capC = r0 + dr, c0 + dc
                if not board.inBound(capR, capC) or board.board[capR][capC].lower() == board.sideToPlay() or board.board[capR][capC] == ' ':
                    continue
                r1, c1 = capR + dr, capC + dc
                if not board.inBound(r1, c1) or board.board[r1][c1].lower() != ' ':
                    continue
                promoted = board.hasPromoted(r1, board.board[r0][c0])
                move = Move(r0, c0, r1, c1, True, promoted,
                            board.board[capR][capC])
                moves.append(move)
                yield deepcopy(moves)
                boardCopy = deepcopy(board)
                boardCopy.makeMove(move)
                yield from getJump(boardCopy, r1, c1, moves)
                moves.pop()
                del boardCopy
        hasJump = False
        for r in range(8):
            for c in range(8):
                m = []
                yield from getJump(deepcopy(self), r, c, m)
                if len(m) >= 1:
                    hasJump = True

        if FORCE_JUMP and hasJump:
            return
        for r in range(8):
            for c in range(8):
                yield from getPush(r, c)

    def eval(self):
        score = 0
        for r in range(8):
            for c in range(8):
                piece = self.board[r][c]
                centre = (3-r if r <= 3 else r-4) + (3-c if c <= 3 else c-4)
                match piece:
                    case 'b': score += 2 + 0.03 * r + centre * 0.01
                    case 'B': score += 3 + centre * 0.02
                    case 'w': score -= 2 + 0.03 * (7-r) + centre * 0.01
                    case 'W': score -= 3 + centre * 0.02
        # mobility = len([*self.getMoves()])
        return score if self.blackToPlay else -score

    def negamax(self, board, alpha, beta, depth):
        if depth == 0:
            return board.eval()
        if board.isTerminalState():
            return - 900 - depth if board.blackToPlay else 900 + depth
        score = -9999
        for m in board.getMoves():
            isJump = isinstance(m, list)
            boardCopy = deepcopy(board)
            if isJump:
                boardCopy.makeJump(m)
            else:
                boardCopy.makeMove(m)
            boardCopy.blackToPlay = not board.blackToPlay
            score = max(
                score, -self.negamax(boardCopy, -beta, -alpha, depth-1))
            del boardCopy
            if score >= beta:
                return beta
            if score > alpha:
                alpha = score
        return alpha

    def search(self):
        bestMove = None
        bestScore = -9999
        for m in self.getMoves():
            isJump = isinstance(m, list)
            boardCopy = deepcopy(self)
            if isJump:
                boardCopy.makeJump(m)
            else:
                boardCopy.makeMove(m)
            boardCopy.blackToPlay = not self.blackToPlay
            score = -self.negamax(boardCopy, -9999, 9999, DEPTH)
            del boardCopy
            if score > bestScore:
                bestScore = score
                bestMove = m
        return bestMove, bestScore


# if __name__ == "__main__":
#     board = Board()
#     board.print()
#     while not board.isTerminalState():
#         # Bot move
#         m, score = board.search()
#         isJump = isinstance(m, list)
#         if isJump:
#             board.makeJump(m)
#         else:
#             board.makeMove(m)
#         board.print()
#         print(m, score)
#         if board.isTerminalState():
#             print('Computer Won')
#             exit()
#         # Player move
#         possibleMove = None
#         board.blackToPlay = not board.blackToPlay
#         while True:
#             move = input()
#             if '-' in move:
#                 fromSq, toSq = move.split('-')
#                 if len(fromSq) == 2 and len(toSq) == 2:
#                     r0, c0, r1, c1 = int(fromSq[0]), int(
#                         fromSq[1]), int(toSq[0]), int(toSq[1])
#                     possibleMove = Move(
#                         r0, c0, r1, c1, False, board.hasPromoted(r0, board.board[r0][c0]))
#                     if possibleMove in board.getMoves():
#                         board.makeMove(possibleMove)
#                         break
#             if 'x' in move:
#                 moves = move.split('x')
#                 if len(moves) >= 2:
#                     m = []
#                     for i in range(len(moves)-1):
#                         r0, c0, r1, c1 = int(moves[i][0]), int(moves[i][1]), int(moves[i +
#                                                                                        1][0]), int(moves[i+1][1])
#                         possibleMove = Move(r0, c0, r1, c1, True, board.hasPromoted(
#                             r0, board.board[r0][c0]), board.board[(r0+r1)//2][(c0+c1)//2])
#                         m.append(possibleMove)
#                     if m in board.getMoves():
#                         board.makeJump(m)
#                         break
#             print('Move not recognised! Please check the format and enter another move')
#         board.blackToPlay = not board.blackToPlay
#         board.print()
#         if board.isTerminalState():
#             print('Player Won')
#             exit()


if __name__ == "__main__":
    board = Board()
    board.print()
    while not board.isTerminalState():
        # Bot move
        m, score = board.search()
        isJump = isinstance(m, list)
        if isJump:
            board.makeJump(m)
        else:
            board.makeMove(m)
        board.print()
        print(m, score)
        if board.isTerminalState():
            print('Computer Won')
            exit()
        board.blackToPlay = not board.blackToPlay
