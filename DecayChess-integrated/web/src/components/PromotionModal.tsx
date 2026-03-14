import React from 'react';
import { PIECE_IMAGES } from '../lib/constants';

interface PromotionModalProps {
  visible: boolean;
  playerColor: 'white' | 'black';
  onSelect: (piece: string) => void;
  onCancel: () => void;
}

const PromotionModal: React.FC<PromotionModalProps> = ({
  visible, playerColor, onSelect, onCancel,
}) => {
  if (!visible) return null;

  const pieces = playerColor === 'white' ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n'];
  const promotionChars = ['q', 'r', 'b', 'n'];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content promotion-modal" onClick={e => e.stopPropagation()}>
        <h3 className="promotion-title">Promote Pawn</h3>
        <div className="promotion-options">
          {pieces.map((piece, i) => (
            <button
              key={piece}
              className="promotion-piece-btn"
              onClick={() => onSelect(promotionChars[i])}
            >
              <img src={PIECE_IMAGES[piece]} alt={piece} className="promotion-piece-img" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;
