import React from 'react';
import { COLORS, PIECE_VALUES } from '../lib/constants';

interface PlayerInfoProps {
  username: string;
  rating: number;
  time: number;
  isActive: boolean;
  capturedPieces?: string[];
  isTop?: boolean;
}

function formatTime(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({
  username, rating, time, isActive, capturedPieces = [], isTop,
}) => {
  const isLowTime = time < 30000;
  const isCriticalTime = time < 10000;

  // Sort captured pieces by value
  const sorted = [...capturedPieces].sort((a, b) =>
    (PIECE_VALUES[b] || 0) - (PIECE_VALUES[a] || 0)
  );

  return (
    <div className={`player-info ${isActive ? 'active' : ''} ${isTop ? 'top' : 'bottom'}`}>
      <div className="player-details">
        <div className="player-avatar">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="player-name-rating">
          <span className="player-name">{username}</span>
          <span className="player-rating">{rating}</span>
        </div>
        {sorted.length > 0 && (
          <div className="captured-pieces">
            {sorted.map((p, i) => (
              <span key={i} className="captured-piece-icon">
                {getPieceUnicode(p)}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className={`timer ${isActive ? 'timer-active' : ''} ${isCriticalTime ? 'timer-critical' : isLowTime ? 'timer-low' : ''}`}>
        {formatTime(time)}
      </div>
    </div>
  );
};

function getPieceUnicode(piece: string): string {
  const map: Record<string, string> = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  };
  return map[piece] || piece;
}

export default PlayerInfo;
