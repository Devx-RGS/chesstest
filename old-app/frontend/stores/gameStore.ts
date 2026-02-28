/**
 * gameStore — Central Zustand store for interactive chess sessions
 *
 * Manages: session lifecycle, chess position (FEN), move validation (chess.js),
 * evaluation state, bot moves, and session status.
 */

import { create } from 'zustand';
import { Chess, Square } from 'chess.js';
import {
    EvalResult,
    classifyEval,
    COLLAPSE_DELAY_MS,
} from '@/services/EvaluationController';

// ============== TYPES ==============

export type SessionStatus =
    | 'idle'
    | 'active'
    | 'warning'
    | 'collapsed'
    | 'checkmate'
    | 'stalemate'
    | 'draw'
    | 'ended';

export interface MoveRecord {
    from: string;
    to: string;
    san: string;
    color: 'w' | 'b';
    fen: string;
}

interface GameState {
    // Session lifecycle
    sessionStatus: SessionStatus;
    isEngineReady: boolean;
    isEvaluating: boolean;

    // Chess position
    fen: string;
    initialFen: string;
    playerColor: 'w' | 'b';
    moveHistory: MoveRecord[];

    // Game result info
    gameOverMessage: string | null;

    // Evaluation
    evaluation: EvalResult | null;

    // Internal chess.js instance (not serializable, but fine for Zustand)
    _chess: Chess | null;

    // Actions
    startSession: (fen: string, playerColor: 'w' | 'b') => void;
    restartSession: () => void;
    makeMove: (from: string, to: string) => boolean;
    makeBotMove: (uciMove: string) => void;
    updateEvaluation: (eval_: EvalResult) => void;
    endSession: () => void;
    setEngineReady: (ready: boolean) => void;
    getLegalMoves: (square: string) => string[];
    reset: () => void;
}

// ============== INITIAL STATE ==============

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const initialState = {
    sessionStatus: 'idle' as SessionStatus,
    isEngineReady: false,
    isEvaluating: false,
    fen: INITIAL_FEN,
    initialFen: INITIAL_FEN,
    playerColor: 'w' as 'w' | 'b',
    moveHistory: [] as MoveRecord[],
    gameOverMessage: null as string | null,
    evaluation: null as EvalResult | null,
    _chess: null as Chess | null,
};

// ============== HELPERS ==============

/**
 * Check if the game is over and return the appropriate status + message.
 * Returns null if the game is still ongoing.
 */
function checkGameOver(
    chess: Chess,
    playerColor: 'w' | 'b'
): { status: SessionStatus; message: string } | null {
    if (chess.isCheckmate()) {
        // The side whose turn it is has been checkmated
        const loser = chess.turn(); // side to move is the one in checkmate
        const playerWon = loser !== playerColor;
        return {
            status: 'checkmate',
            message: playerWon ? '🏆 Checkmate! You win!' : '💀 Checkmate! You lost.',
        };
    }
    if (chess.isStalemate()) {
        return { status: 'stalemate', message: '🤝 Stalemate — Draw!' };
    }
    if (chess.isDraw()) {
        return { status: 'draw', message: '🤝 Draw!' };
    }
    return null;
}

// ============== STORE ==============

export const useGameStore = create<GameState>((set, get) => ({
    ...initialState,

    /**
     * Start a new interactive chess session.
     * Initializes chess.js with the given FEN and sets the player color.
     * Immediately checks for game-over (e.g. if FEN is already checkmate).
     */
    startSession: (fen: string, playerColor: 'w' | 'b') => {
        const chess = new Chess(fen);

        // Check if position is already game-over
        const gameOver = checkGameOver(chess, playerColor);
        if (gameOver) {
            set({
                sessionStatus: gameOver.status,
                gameOverMessage: gameOver.message,
                fen,
                initialFen: fen,
                playerColor,
                moveHistory: [],
                evaluation: null,
                isEvaluating: false,
                _chess: chess,
            });
            console.log(`[GameStore] Session started with game-over: ${gameOver.message}`);
            return;
        }

        set({
            sessionStatus: 'active',
            fen,
            initialFen: fen,
            playerColor,
            moveHistory: [],
            gameOverMessage: null,
            evaluation: null,
            isEvaluating: true,
            _chess: chess,
        });
        console.log(`[GameStore] Session started — FEN: ${fen}, Color: ${playerColor}`);
    },

    /**
     * Restart the session with the same FEN and player color.
     */
    restartSession: () => {
        const { initialFen, playerColor } = get();
        get().startSession(initialFen, playerColor);
    },

    /**
     * Player makes a move. Validates with chess.js.
     * Returns true if the move was legal, false otherwise.
     */
    makeMove: (from: string, to: string): boolean => {
        const { _chess, playerColor, sessionStatus } = get();
        if (!_chess || (sessionStatus !== 'active' && sessionStatus !== 'warning')) return false;

        // Verify it's the player's turn
        if (_chess.turn() !== playerColor) return false;

        try {
            const move = _chess.move({ from: from as Square, to: to as Square, promotion: 'q' });
            if (!move) return false;

            const newFen = _chess.fen();
            const record: MoveRecord = {
                from: move.from,
                to: move.to,
                san: move.san,
                color: move.color,
                fen: newFen,
            };

            set((state) => ({
                fen: newFen,
                moveHistory: [...state.moveHistory, record],
                isEvaluating: true, // Trigger re-evaluation
            }));

            console.log(`[GameStore] Player move: ${move.san}`);

            // Check for game-over after player's move
            const gameOver = checkGameOver(_chess, playerColor);
            if (gameOver) {
                set({
                    sessionStatus: gameOver.status,
                    gameOverMessage: gameOver.message,
                    isEvaluating: false,
                });
                console.log(`[GameStore] Game over: ${gameOver.message}`);
                setTimeout(() => {
                    const current = get();
                    if (current.sessionStatus === gameOver.status) {
                        get().endSession();
                    }
                }, 3000);
            }

            return true;
        } catch {
            return false;
        }
    },

    /**
     * Bot makes the engine's best move.
     * Called by EngineService when it receives a bestmove response.
     */
    makeBotMove: (uciMove: string) => {
        const { _chess, playerColor, sessionStatus } = get();
        if (!_chess || (sessionStatus !== 'active' && sessionStatus !== 'warning')) return;

        // Only make bot move if it's NOT the player's turn
        if (_chess.turn() === playerColor) return;

        try {
            const from = uciMove.substring(0, 2);
            const to = uciMove.substring(2, 4);
            const promotion = uciMove.length > 4 ? uciMove[4] : 'q';

            const move = _chess.move({ from: from as Square, to: to as Square, promotion: promotion as any });
            if (!move) {
                console.warn(`[GameStore] Invalid bot move: ${uciMove}`);
                return;
            }

            const newFen = _chess.fen();
            const record: MoveRecord = {
                from: move.from,
                to: move.to,
                san: move.san,
                color: move.color,
                fen: newFen,
            };

            set((state) => ({
                fen: newFen,
                moveHistory: [...state.moveHistory, record],
                isEvaluating: true, // Re-evaluate after bot move
            }));

            console.log(`[GameStore] Bot move: ${move.san}`);

            // Check for game-over after bot's move
            const gameOver = checkGameOver(_chess, playerColor);
            if (gameOver) {
                set({
                    sessionStatus: gameOver.status,
                    gameOverMessage: gameOver.message,
                    isEvaluating: false,
                });
                console.log(`[GameStore] Game over: ${gameOver.message}`);
                setTimeout(() => {
                    const current = get();
                    if (current.sessionStatus === gameOver.status) {
                        get().endSession();
                    }
                }, 3000);
            }
        } catch (err) {
            console.error(`[GameStore] Bot move error:`, err);
        }
    },

    /**
     * Update evaluation from the engine.
     * If evaluation collapses below threshold, end session after delay.
     */
    updateEvaluation: (eval_: EvalResult) => {
        const { sessionStatus, playerColor, _chess } = get();
        if (sessionStatus !== 'active' && sessionStatus !== 'warning') return;

        // Adjust score for player's perspective
        // Engine always reports from white's perspective (normalized in EngineService)
        const adjustedScore = playerColor === 'b' ? -eval_.scorePawns : eval_.scorePawns;
        const adjustedStatus = classifyEval(adjustedScore);
        const adjustedEval: EvalResult = {
            ...eval_,
            scorePawns: adjustedScore,
            scoreCp: playerColor === 'b' ? -eval_.scoreCp : eval_.scoreCp,
            status: adjustedStatus,
        };

        set({
            evaluation: adjustedEval,
            isEvaluating: false,
        });

        // Only apply collapse/warning status transitions when it's the PLAYER's turn.
        // When it's the bot's turn the evaluation reflects the starting position,
        // not the quality of the player's play — collapsing here would freeze the
        // game before the bot even moves.
        const isBotTurn = _chess && _chess.turn() !== playerColor;
        if (isBotTurn) return;

        // Handle status transitions
        if (adjustedStatus === 'collapsed') {
            set({ sessionStatus: 'collapsed', gameOverMessage: '💥 Position Collapsed!' });
        } else if (adjustedStatus === 'warning') {
            set({ sessionStatus: 'warning' });
        } else {
            set({ sessionStatus: 'active' });
        }
    },

    /**
     * End the interactive session.
     */
    endSession: () => {
        set({
            sessionStatus: 'ended',
            isEvaluating: false,
        });
        console.log('[GameStore] Session ended');
    },

    setEngineReady: (ready: boolean) => {
        set({ isEngineReady: ready });
    },

    /**
     * Get legal moves for a piece at the given square.
     * Returns array of target square strings (e.g. ["e4", "e3"]).
     */
    getLegalMoves: (square: string): string[] => {
        const { _chess } = get();
        if (!_chess) return [];

        try {
            const moves = _chess.moves({ square: square as Square, verbose: true });
            return moves.map((m) => m.to);
        } catch {
            return [];
        }
    },

    /**
     * Full reset — clear entire state back to initial.
     */
    reset: () => {
        set({ ...initialState });
    },
}));
