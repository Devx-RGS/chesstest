import React, { useMemo } from 'react';
import { BOARD_THEME, FILES, RANKS, PIECE_IMAGES, COLORS } from '../lib/constants';
import type { DecayState } from '../lib/types';
import './ChessBoard.css';

interface ChessBoardProps {
  boardFlipped: boolean;
  selectedSquare: string | null;
  possibleMoves: string[];
  lastMove: { from: string; to: string } | null;
  getPieceAt: (square: string) => string | null;
  onSquareClick: (square: string) => void;
  decayState: { white: DecayState; black: DecayState };
  frozenPieces: { white: Set<string>; black: Set<string> };
}

function formatDecayTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  boardFlipped, selectedSquare, possibleMoves, lastMove,
  getPieceAt, onSquareClick, decayState, frozenPieces,
}) => {
  const files = useMemo(() => boardFlipped ? [...FILES].reverse() : FILES, [boardFlipped]);
  const ranks = useMemo(() => boardFlipped ? [...RANKS].reverse() : RANKS, [boardFlipped]);

  return (
    <div className="chess-board-wrapper">
      {/* Rank labels (left side) */}
      <div className="rank-labels">
        {ranks.map(r => <div key={r} className="coord-label">{r}</div>)}
      </div>

      <div className="chess-board-container">
        <div className="chess-board">
          {ranks.map(rank =>
            files.map(file => {
              const square = `${file}${rank}`;
              const isLight = (FILES.indexOf(file) + parseInt(rank)) % 2 === 0;
              const piece = getPieceAt(square);
              const isSelected = selectedSquare === square;
              const isPossibleMove = possibleMoves.includes(square);
              const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);

              // Decay & frozen detection
              const isFrozenW = frozenPieces.white.has(square);
              const isFrozenB = frozenPieces.black.has(square);
              const isFrozen = isFrozenW || isFrozenB;
              const decayTimerW = decayState.white[square];
              const decayTimerB = decayState.black[square];
              const activeDecay = (decayTimerW?.isActive && decayTimerW) || (decayTimerB?.isActive && decayTimerB);

              let bgColor = isLight ? BOARD_THEME.lightSquare : BOARD_THEME.darkSquare;
              if (isSelected) bgColor = BOARD_THEME.highlight.selected;
              else if (isLastMove) bgColor = BOARD_THEME.highlight.lastMove + '88';

              return (
                <div
                  key={square}
                  className={`chess-square ${isSelected ? 'selected' : ''} ${isFrozen ? 'frozen' : ''}`}
                  style={{ backgroundColor: bgColor }}
                  onClick={() => onSquareClick(square)}
                  data-square={square}
                >
                  {/* Possible move indicator */}
                  {isPossibleMove && (
                    <div className={`move-indicator ${piece ? 'capture' : 'dot'}`} />
                  )}

                  {/* Piece image */}
                  {piece && !isFrozen && (
                    <img
                      src={PIECE_IMAGES[piece]}
                      alt={piece}
                      className="chess-piece"
                      draggable={false}
                    />
                  )}

                  {/* Frozen piece with overlay */}
                  {piece && isFrozen && (
                    <div className="frozen-piece-wrapper">
                      <img
                        src={PIECE_IMAGES[piece]}
                        alt={piece}
                        className="chess-piece frozen-piece-img"
                        draggable={false}
                      />
                      <div className="frozen-overlay">
                        <span className="frozen-icon">❄</span>
                      </div>
                    </div>
                  )}

                  {/* Decay timer */}
                  {activeDecay && (
                    <div className={`decay-timer ${activeDecay.timeLeft < 5000 ? 'critical' : ''}`}>
                      {formatDecayTime(activeDecay.timeLeft)}
                    </div>
                  )}

                  {/* Coordinate labels */}
                  {file === files[0] && (
                    <span className="coord coord-rank">{rank}</span>
                  )}
                  {rank === ranks[ranks.length - 1] && (
                    <span className="coord coord-file">{file}</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* File labels (bottom) */}
        <div className="file-labels">
          {files.map(f => <div key={f} className="coord-label">{f}</div>)}
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
