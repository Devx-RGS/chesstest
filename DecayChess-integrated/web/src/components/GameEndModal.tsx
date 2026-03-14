import React from 'react';

interface GameEndModalProps {
  visible: boolean;
  message: string;
  isWinner: boolean | null;
  details: {
    reason?: string;
    winner?: string | null;
  };
  onClose: () => void;
  onBackToLobby: () => void;
}

const GameEndModal: React.FC<GameEndModalProps> = ({
  visible, message, isWinner, details, onClose, onBackToLobby,
}) => {
  if (!visible) return null;

  const emoji = isWinner === true ? '🏆' : isWinner === false ? '😞' : '🤝';
  const colorClass = isWinner === true ? 'win' : isWinner === false ? 'loss' : 'draw';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content game-end-modal ${colorClass}`} onClick={e => e.stopPropagation()}>
        <div className="game-end-emoji">{emoji}</div>
        <h2 className="game-end-title">{message}</h2>
        {details.reason && (
          <p className="game-end-reason">
            {details.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
        )}
        {details.winner && (
          <p className="game-end-winner">Winner: {details.winner}</p>
        )}
        <div className="game-end-actions">
          <button className="btn btn-primary" onClick={onBackToLobby}>
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameEndModal;
