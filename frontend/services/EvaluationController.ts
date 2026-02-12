/**
 * EvaluationController — Pure logic for chess engine evaluation
 *
 * Handles:
 * - UCI info line parsing (score, depth, best move)
 * - Evaluation score classification (excellent / good / warning / collapsed)
 * - Threshold constants for session management
 */

// ============== THRESHOLDS ==============

/** Score (in pawns) below which we show a WARNING badge */
export const EVAL_WARNING_THRESHOLD = -0.8;

/** Score (in pawns) below which the session COLLAPSES (ends) */
export const EVAL_COLLAPSE_THRESHOLD = -4.5;

/** Delay (ms) before ending session after collapse */
export const COLLAPSE_DELAY_MS = 1200;

/** Default engine search depth */
export const DEFAULT_DEPTH = 12;

// ============== TYPES ==============

export type EvalStatus = 'excellent' | 'good' | 'warning' | 'collapsed';

export interface EvalResult {
    /** Score in centipawns (positive = good for current player) */
    scoreCp: number;
    /** Score in pawns (scoreCp / 100) */
    scorePawns: number;
    /** Best move in UCI format (e.g. "e2e4") */
    bestMove: string | null;
    /** Search depth reached */
    depth: number;
    /** Classification based on thresholds */
    status: EvalStatus;
}

export interface UCIInfo {
    depth: number;
    scoreCp: number;
    mate: number | null;
    bestMove: string | null;
    pv: string[];
}

// ============== PARSING ==============

/**
 * Parse a UCI "info depth ..." line into structured data.
 *
 * Example input:
 *   "info depth 12 seldepth 18 multipv 1 score cp -45 nodes 125000 nps 500000 pv e7e5 d2d4"
 *
 * @param infoLine - Raw UCI info string
 * @returns Parsed UCI info, or null if unparseable
 */
export function parseUCIInfo(infoLine: string): UCIInfo | null {
    if (!infoLine.startsWith('info depth')) return null;

    const tokens = infoLine.split(/\s+/);
    const result: UCIInfo = {
        depth: 0,
        scoreCp: 0,
        mate: null,
        bestMove: null,
        pv: [],
    };

    for (let i = 0; i < tokens.length; i++) {
        switch (tokens[i]) {
            case 'depth':
                result.depth = parseInt(tokens[i + 1], 10) || 0;
                break;
            case 'score':
                if (tokens[i + 1] === 'cp') {
                    result.scoreCp = parseInt(tokens[i + 2], 10) || 0;
                } else if (tokens[i + 1] === 'mate') {
                    result.mate = parseInt(tokens[i + 2], 10) || 0;
                    // Convert mate to a large centipawn value for consistency
                    result.scoreCp = result.mate > 0 ? 10000 : -10000;
                }
                break;
            case 'pv':
                // Everything after "pv" is the principal variation
                result.pv = tokens.slice(i + 1);
                result.bestMove = result.pv[0] || null;
                i = tokens.length; // break out of loop
                break;
        }
    }

    return result;
}

// ============== CLASSIFICATION ==============

/**
 * Classify an evaluation score into a status category.
 *
 * @param scorePawns - Score in pawns from the player's perspective (negative = losing)
 * @returns EvalStatus classification
 */
export function classifyEval(scorePawns: number): EvalStatus {
    if (scorePawns <= EVAL_COLLAPSE_THRESHOLD) return 'collapsed';
    if (scorePawns <= EVAL_WARNING_THRESHOLD) return 'warning';
    if (scorePawns >= 0.5) return 'excellent';
    return 'good';
}

/**
 * Convert a UCI move (e.g. "e2e4") to human-readable notation (e.g. "e2 → e4").
 *
 * @param uciMove - Move in UCI format
 * @returns Formatted string
 */
export function formatUCIMove(uciMove: string): string {
    if (!uciMove || uciMove.length < 4) return uciMove || '—';
    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    return `${from} → ${to}`;
}

/**
 * Get display color for a given eval status.
 */
export function getStatusColor(status: EvalStatus): string {
    switch (status) {
        case 'excellent': return '#4CAF50'; // green
        case 'good': return '#8BC34A';      // light green
        case 'warning': return '#FF9800';   // orange
        case 'collapsed': return '#F44336'; // red
    }
}

/**
 * Get display label for a given eval status.
 */
export function getStatusLabel(status: EvalStatus): string {
    switch (status) {
        case 'excellent': return '✓ Excellent';
        case 'good': return '● Good';
        case 'warning': return '⚠ Warning';
        case 'collapsed': return '✕ Collapsed';
    }
}
