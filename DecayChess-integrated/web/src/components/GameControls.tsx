import React from 'react';

interface GameControlsProps {
  onResign: () => void;
  onOfferDraw: () => void;
  onFlipBoard: () => void;
  isGameActive: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  onResign, onOfferDraw, onFlipBoard, isGameActive,
}) => {
  return (
    <div className="game-controls">
      <button
        className="control-btn flip-btn"
        onClick={onFlipBoard}
        title="Flip Board"
      >
        🔄 Flip
      </button>
      {isGameActive && (
        <>
          <button
            className="control-btn draw-btn"
            onClick={onOfferDraw}
            title="Offer Draw"
          >
            🤝 Draw
          </button>
          <button
            className="control-btn resign-btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to resign?')) {
                onResign();
              }
            }}
            title="Resign"
          >
            🏳️ Resign
          </button>
        </>
      )}
    </div>
  );
};

export default GameControls;
