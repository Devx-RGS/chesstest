import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { useSocket } from './useSocket';
import type { GameState, DecayState, Move } from '../lib/types';
import {
  FILES, RANKS, MAJOR_PIECES,
  QUEEN_INITIAL_DECAY_TIME, MAJOR_PIECE_INITIAL_DECAY_TIME, DECAY_TIME_INCREMENT,
} from '../lib/constants';

function safeTimerValue(val: any): number {
  const n = Number(val);
  return isNaN(n) || val === undefined || val === null ? 0 : Math.max(0, n);
}

export function useDecayGame(initialGameState: GameState, userId: string) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [boardFlipped, setBoardFlipped] = useState(false);
  const [moveHistory, setMoveHistory] = useState<any[]>([]);
  const [promotionModal, setPromotionModal] = useState<{
    visible: boolean; from: string; to: string;
  } | null>(null);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [gameEndMessage, setGameEndMessage] = useState('');
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [gameEndDetails, setGameEndDetails] = useState<any>({});

  // Timers
  const [localTimers, setLocalTimers] = useState({
    white: safeTimerValue(initialGameState.timeControl.timers.white),
    black: safeTimerValue(initialGameState.timeControl.timers.black),
  });
  const timerRef = useRef<any>(null);
  const decayTimerRef = useRef<any>(null);

  // Decay state
  const [decayState, setDecayState] = useState<{ white: DecayState; black: DecayState }>({
    white: {}, black: {},
  });
  const [frozenPieces, setFrozenPieces] = useState<{ white: Set<string>; black: Set<string> }>({
    white: new Set(), black: new Set(),
  });

  // Chess.js instance for client-side move validation
  const chessRef = useRef<Chess | null>(null);

  // Socket connection
  const { emit, on } = useSocket({
    namespace: '/game',
    auth: {
      userId,
      sessionId: initialGameState.sessionId,
      variant: 'decay',
    },
  });

  // Initialize player color
  useEffect(() => {
    const color = initialGameState.userColor?.[userId];
    if (color) {
      setPlayerColor(color);
      setBoardFlipped(color === 'black');
    }
  }, [initialGameState, userId]);

  // Keep chess instance in sync
  useEffect(() => {
    if (gameState.board?.fen) {
      try {
        chessRef.current = new Chess(gameState.board.fen);
      } catch (e) {
        console.error('Error creating chess instance:', e);
      }
    }
  }, [gameState.board?.fen]);

  // Update turn status
  useEffect(() => {
    setIsMyTurn(gameState.board.activeColor === playerColor && gameState.status === 'active');
  }, [gameState.board.activeColor, playerColor, gameState.status]);

  // --- Helpers ---
  const getPieceAt = useCallback((square: string): string | null => {
    const fi = FILES.indexOf(square[0]);
    const ri = RANKS.indexOf(square[1]);
    if (fi === -1 || ri === -1) return null;
    const fen = gameState.board.fen || gameState.board.position;
    if (!fen) return null;
    const rows = fen.split(' ')[0].split('/');
    if (rows.length !== 8) return null;
    const row = rows[ri];
    let col = 0;
    for (const c of row) {
      if (c >= '1' && c <= '8') { col += parseInt(c); }
      else { if (col === fi) return c; col++; }
    }
    return null;
  }, [gameState.board.fen, gameState.board.position]);

  const getPieceColor = (piece: string): 'white' | 'black' =>
    piece === piece.toUpperCase() ? 'white' : 'black';

  const isQueen = (piece: string) => piece.toLowerCase() === 'q';
  const isMajorPiece = (piece: string) => MAJOR_PIECES.includes(piece);

  // Calculate possible moves client-side
  const calculatePossibleMoves = useCallback((square: string): string[] => {
    if (!chessRef.current) return [];
    try {
      if (frozenPieces[playerColor].has(square)) return [];
      const moves = chessRef.current.moves({ square: square as any, verbose: true });
      return moves.map((m: any) => m.to);
    } catch { return []; }
  }, [frozenPieces, playerColor]);

  // --- Square selection & move ---
  const handleSquareClick = useCallback((square: string) => {
    if (gameState.status !== 'active') return;

    const piece = getPieceAt(square);

    // If we have a selected square and this is a legal move target
    if (selectedSquare && possibleMoves.includes(square)) {
      const fromPiece = getPieceAt(selectedSquare);
      // Check for pawn promotion
      if (fromPiece && fromPiece.toLowerCase() === 'p') {
        const targetRank = square[1];
        if ((playerColor === 'white' && targetRank === '8') ||
            (playerColor === 'black' && targetRank === '1')) {
          setPromotionModal({ visible: true, from: selectedSquare, to: square });
          return;
        }
      }
      // Make the move
      makeMove({ from: selectedSquare, to: square });
      return;
    }

    // If clicking own piece, select it
    if (piece && isMyTurn) {
      const pieceColor = getPieceColor(piece);
      if (pieceColor === playerColor) {
        if (frozenPieces[playerColor].has(square)) return;
        setSelectedSquare(square);
        setPossibleMoves(calculatePossibleMoves(square));
        return;
      }
    }

    // Deselect
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, [selectedSquare, possibleMoves, gameState.status, isMyTurn, playerColor, getPieceAt, calculatePossibleMoves, frozenPieces]);

  const makeMove = useCallback((move: Move) => {
    emit('game:makeMove', { move, timestamp: Date.now() });
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, [emit]);

  const handlePromotion = useCallback((piece: string) => {
    if (!promotionModal) return;
    makeMove({ from: promotionModal.from, to: promotionModal.to, promotion: piece });
    setPromotionModal(null);
  }, [promotionModal, makeMove]);

  const resign = useCallback(() => { emit('game:resign'); }, [emit]);
  const offerDraw = useCallback(() => { emit('game:offerDraw'); }, [emit]);
  const acceptDraw = useCallback(() => { emit('game:acceptDraw'); }, [emit]);
  const declineDraw = useCallback(() => { emit('game:declineDraw'); }, [emit]);

  // --- Decay state sync from server ---
  const syncDecayFromServer = useCallback((gs: any) => {
    if (!gs) return;
    const qt = gs.board?.queenDecayTimers || gs.gameState?.queenDecayTimers;
    const mt = gs.board?.majorPieceDecayTimers || gs.gameState?.majorPieceDecayTimers;
    const fp = gs.board?.frozenPieces || gs.gameState?.frozenPieces;

    if (qt || mt) {
      setDecayState(() => {
        const newState: { white: DecayState; black: DecayState } = { white: {}, black: {} };
        (['white', 'black'] as const).forEach(color => {
          const queenT = qt?.[color];
          const majorT = mt?.[color];
          let active: { square: string; timeRemaining: number; moveCount: number } | null = null;
          if (queenT?.active && !queenT?.frozen && queenT?.square) {
            active = { square: queenT.square, timeRemaining: queenT.timeRemaining, moveCount: queenT.moveCount || 1 };
          } else if (majorT?.active && !majorT?.frozen && majorT?.square) {
            active = { square: majorT.square, timeRemaining: majorT.timeRemaining, moveCount: majorT.moveCount || 1 };
          }
          if (active) {
            newState[color][active.square] = {
              timeLeft: active.timeRemaining, isActive: true,
              moveCount: active.moveCount, pieceSquare: active.square,
            };
          }
        });
        return newState;
      });
    }

    if (fp) {
      setFrozenPieces(() => {
        const nf = { white: new Set<string>(), black: new Set<string>() };
        (['white', 'black'] as const).forEach(color => {
          const arr = fp[color] || [];
          if (Array.isArray(arr)) arr.forEach((sq: string) => nf[color].add(sq));
        });
        return nf;
      });
    }
  }, []);

  // --- Socket event listeners ---
  useEffect(() => {
    const unsub: (() => void)[] = [];

    unsub.push(on('game:move', ({ move: moveObj, gameState: gs }: any) => {
      setGameState(gs);
      syncDecayFromServer(gs);
      if (gs.board?.moveHistory) setMoveHistory(gs.board.moveHistory);
    }));

    unsub.push(on('game:timer', ({ white, black }: any) => {
      setLocalTimers({ white: safeTimerValue(white), black: safeTimerValue(black) });
    }));

    unsub.push(on('game:gameState', ({ gameState: gs }: any) => {
      setGameState(gs);
      syncDecayFromServer(gs);
    }));

    unsub.push(on('game:end', ({ gameState: gs }: any) => {
      setGameState(gs);
      const winner = gs.winnerColor;
      const isWin = winner === playerColor;
      const isDraw = !winner;
      setIsWinner(isDraw ? null : isWin);
      setGameEndMessage(
        isDraw ? 'Game drawn!' : isWin ? 'You won!' : 'You lost!'
      );
      setGameEndDetails({
        reason: gs.resultReason || gs.result,
        winner: winner ? gs.players?.[winner]?.username : null,
      });
      setShowGameEndModal(true);
    }));

    unsub.push(on('game:error', ({ message }: any) => {
      console.error('[Game Error]', message);
    }));

    return () => { unsub.forEach(fn => fn()); };
  }, [on, syncDecayFromServer, playerColor]);

  // --- Game clock countdown ---
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (gameState.status !== 'active') return;

    const lastSync = { ...localTimers, timestamp: Date.now() };

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastSync.timestamp;
      const active = gameState.board.activeColor;
      setLocalTimers(prev => ({
        white: active === 'white' ? Math.max(0, lastSync.white - elapsed) : prev.white,
        black: active === 'black' ? Math.max(0, lastSync.black - elapsed) : prev.black,
      }));
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [gameState.status, gameState.board.activeColor, localTimers.white, localTimers.black]);

  // --- Decay timer countdown ---
  useEffect(() => {
    if (decayTimerRef.current) clearInterval(decayTimerRef.current);
    if (gameState.status !== 'active') return;

    decayTimerRef.current = setInterval(() => {
      setDecayState(prev => {
        const newState: { white: DecayState; black: DecayState } = { white: {}, black: {} };
        let changed = false;
        (['white', 'black'] as const).forEach(color => {
          const entries = Object.entries(prev[color]);
          if (entries.length === 0) return;
          // Only one timer per player
          const [sq, timer] = entries[0];
          if (timer && timer.isActive) {
            const newTime = Math.max(0, timer.timeLeft - 100);
            if (newTime !== timer.timeLeft) changed = true;
            if (newTime > 0) {
              newState[color][sq] = { ...timer, timeLeft: newTime };
            }
            // If timer hits 0, server will handle freezing
          }
        });
        return changed ? newState : prev;
      });
    }, 100);

    return () => clearInterval(decayTimerRef.current);
  }, [gameState.status]);

  return {
    gameState, playerColor, isMyTurn, boardFlipped, setBoardFlipped,
    selectedSquare, possibleMoves, handleSquareClick,
    localTimers, decayState, frozenPieces,
    moveHistory, promotionModal, handlePromotion,
    showGameEndModal, setShowGameEndModal, gameEndMessage, isWinner, gameEndDetails,
    resign, offerDraw, acceptDraw, declineDraw,
    getPieceAt, makeMove,
  };
}
