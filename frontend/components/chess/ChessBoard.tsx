/**
 * ChessBoard — Interactive 8×8 tap-to-move chess board
 *
 * Renders Unicode chess pieces on alternating colored squares.
 * Supports tap-to-select, tap-to-move with legal move highlights.
 * Coordinate labels (a-h, 1-8) on edges.
 * Reads from and dispatches to the game store.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '@/stores/gameStore';

// ============== CONSTANTS ==============

const BOARD_PADDING = 4;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 48, 380); // max 380px on tablets
const SQUARE_SIZE = (BOARD_SIZE - BOARD_PADDING * 2) / 8;

// Unicode chess pieces
const PIECE_SYMBOLS: Record<string, string> = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

// Board colors
const COLORS = {
    lightSquare: '#F0D9B5',
    darkSquare: '#B58863',
    selectedSquare: '#829769',
    legalMoveLight: 'rgba(130, 151, 105, 0.5)',
    legalMoveDark: 'rgba(130, 151, 105, 0.5)',
    lastMoveLight: 'rgba(205, 210, 106, 0.4)',
    lastMoveDark: 'rgba(170, 162, 58, 0.4)',
    coordinateLight: '#B58863',
    coordinateDark: '#F0D9B5',
};

// Files and ranks
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// ============== HELPERS ==============

/**
 * Parse a FEN string into a 2D array of pieces.
 * Returns array[rank][file] where pieces are like 'K', 'p', etc.
 */
function parseFEN(fen: string): (string | null)[][] {
    const board: (string | null)[][] = [];
    const ranks = fen.split(' ')[0].split('/');

    for (const rank of ranks) {
        const row: (string | null)[] = [];
        for (const char of rank) {
            if (/\d/.test(char)) {
                for (let i = 0; i < parseInt(char, 10); i++) {
                    row.push(null);
                }
            } else {
                row.push(char);
            }
        }
        board.push(row);
    }

    return board;
}

/**
 * Get the color of a piece character.
 */
function getPieceColor(piece: string | null): 'w' | 'b' | null {
    if (!piece) return null;
    return piece === piece.toUpperCase() ? 'w' : 'b';
}

// ============== COMPONENT ==============

interface ChessBoardProps {
    /** If true, board is flipped (black at bottom) */
    flipped?: boolean;
}

export default function ChessBoard({ flipped }: ChessBoardProps) {
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [legalMoves, setLegalMoves] = useState<string[]>([]);

    // Store state
    const fen = useGameStore((s) => s.fen);
    const playerColor = useGameStore((s) => s.playerColor);
    const moveHistory = useGameStore((s) => s.moveHistory);
    const makeMove = useGameStore((s) => s.makeMove);
    const getLegalMoves = useGameStore((s) => s.getLegalMoves);

    // Should the board be flipped?
    const isFlipped = flipped ?? playerColor === 'b';

    // Parse the current FEN into a board
    const board = useMemo(() => parseFEN(fen), [fen]);

    // Last move for highlighting
    const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;

    // Get visual rank/file order based on orientation
    const rankOrder = isFlipped ? [...RANKS].reverse() : RANKS;
    const fileOrder = isFlipped ? [...FILES].reverse() : FILES;

    /**
     * Handle square tap.
     */
    const handleSquareTap = useCallback((square: string) => {
        const piece = getPieceAtSquare(board, square);
        const pieceColor = getPieceColor(piece);

        if (selectedSquare) {
            // A piece is already selected
            if (legalMoves.includes(square)) {
                // Move to this square
                const success = makeMove(selectedSquare, square);
                if (success) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedSquare(null);
                setLegalMoves([]);
                return;
            }

            // Tapping own piece — reselect
            if (pieceColor === playerColor) {
                setSelectedSquare(square);
                setLegalMoves(getLegalMoves(square));
                Haptics.selectionAsync();
                return;
            }

            // Tapping empty or opponent piece that isn't a legal move — deselect
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }

        // No piece selected — select if it's the player's piece
        if (pieceColor === playerColor) {
            setSelectedSquare(square);
            setLegalMoves(getLegalMoves(square));
            Haptics.selectionAsync();
        }
    }, [selectedSquare, legalMoves, playerColor, makeMove, getLegalMoves, board]);

    return (
        <View style={styles.boardContainer}>
            <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
                {rankOrder.map((rank, rankIdx) =>
                    fileOrder.map((file, fileIdx) => {
                        const square = `${file}${rank}`;
                        const isLight = (rankIdx + fileIdx) % 2 === 0;
                        const piece = board[RANKS.indexOf(rank)]?.[FILES.indexOf(file)] || null;
                        const isSelected = square === selectedSquare;
                        const isLegalMove = legalMoves.includes(square);
                        const isLastMoveFrom = lastMove?.from === square;
                        const isLastMoveTo = lastMove?.to === square;
                        const isLastMove = isLastMoveFrom || isLastMoveTo;

                        // Determine background color
                        let bgColor = isLight ? COLORS.lightSquare : COLORS.darkSquare;
                        if (isSelected) bgColor = COLORS.selectedSquare;
                        else if (isLastMove) bgColor = isLight ? COLORS.lastMoveLight : COLORS.lastMoveDark;

                        // Show coordinate labels on bottom row and left column
                        const showFile = rankIdx === 7;
                        const showRank = fileIdx === 0;

                        return (
                            <TouchableOpacity
                                key={square}
                                activeOpacity={0.7}
                                onPress={() => handleSquareTap(square)}
                                style={[
                                    styles.square,
                                    {
                                        width: SQUARE_SIZE,
                                        height: SQUARE_SIZE,
                                        backgroundColor: bgColor,
                                    },
                                ]}
                            >
                                {/* Legal move indicator */}
                                {isLegalMove && (
                                    <View style={[
                                        piece ? styles.captureIndicator : styles.moveIndicator,
                                    ]} />
                                )}

                                {/* Piece */}
                                {piece && (
                                    <Text style={[
                                        styles.piece,
                                        { fontSize: SQUARE_SIZE * 0.7 },
                                    ]}>
                                        {PIECE_SYMBOLS[piece] || ''}
                                    </Text>
                                )}

                                {/* Coordinate labels */}
                                {showRank && (
                                    <Text style={[
                                        styles.coordRank,
                                        { color: isLight ? COLORS.coordinateLight : COLORS.coordinateDark },
                                    ]}>
                                        {rank}
                                    </Text>
                                )}
                                {showFile && (
                                    <Text style={[
                                        styles.coordFile,
                                        { color: isLight ? COLORS.coordinateLight : COLORS.coordinateDark },
                                    ]}>
                                        {file}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </View>
    );
}

/**
 * Get the piece at a given square from the parsed board.
 */
function getPieceAtSquare(board: (string | null)[][], square: string): string | null {
    const file = FILES.indexOf(square[0]);
    const rank = RANKS.indexOf(square[1]);
    if (file === -1 || rank === -1) return null;
    return board[rank]?.[file] || null;
}

// ============== STYLES ==============

const styles = StyleSheet.create({
    boardContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    board: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#654321',
    },
    square: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    piece: {
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    moveIndicator: {
        position: 'absolute',
        width: SQUARE_SIZE * 0.3,
        height: SQUARE_SIZE * 0.3,
        borderRadius: SQUARE_SIZE * 0.15,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    captureIndicator: {
        position: 'absolute',
        width: SQUARE_SIZE * 0.85,
        height: SQUARE_SIZE * 0.85,
        borderRadius: SQUARE_SIZE * 0.425,
        borderWidth: SQUARE_SIZE * 0.08,
        borderColor: 'rgba(0, 0, 0, 0.2)',
        backgroundColor: 'transparent',
    },
    coordRank: {
        position: 'absolute',
        top: 1,
        left: 2,
        fontSize: 9,
        fontWeight: '600',
    },
    coordFile: {
        position: 'absolute',
        bottom: 1,
        right: 2,
        fontSize: 9,
        fontWeight: '600',
    },
});
