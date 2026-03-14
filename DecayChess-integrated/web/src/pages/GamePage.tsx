import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChessBoard from '../components/ChessBoard';
import PlayerInfo from '../components/PlayerInfo';
import GameControls from '../components/GameControls';
import GameEndModal from '../components/GameEndModal';
import PromotionModal from '../components/PromotionModal';
import { useDecayGame } from '../hooks/useDecayGame';

const GamePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { gameState: initialGameState, userId } = location.state || {};

  if (!initialGameState || !userId) {
    navigate('/lobby');
    return null;
  }

  const game = useDecayGame(initialGameState, userId);

  const isWhite = game.playerColor === 'white';
  const topPlayer = isWhite ? initialGameState.players.black : initialGameState.players.white;
  const bottomPlayer = isWhite ? initialGameState.players.white : initialGameState.players.black;
  const topTime = isWhite ? game.localTimers.black : game.localTimers.white;
  const bottomTime = isWhite ? game.localTimers.white : game.localTimers.black;
  const topActive = isWhite
    ? game.gameState.board.activeColor === 'black'
    : game.gameState.board.activeColor === 'white';
  const bottomActive = !topActive;

  const lastMove = game.gameState.gameState?.lastMove
    ? { from: game.gameState.gameState.lastMove.from, to: game.gameState.gameState.lastMove.to }
    : game.gameState.lastMove
    ? { from: game.gameState.lastMove.from, to: game.gameState.lastMove.to }
    : null;

  return (
    <div className="page game-page">
      <div className="game-layout">
        {/* Left panel: move history */}
        <div className="game-sidebar">
          <h3 className="sidebar-title">Moves</h3>
          <div className="move-history-list">
            {game.moveHistory.length === 0 && (
              <p className="no-moves">No moves yet</p>
            )}
            {game.moveHistory.map((move: any, i: number) => (
              <span key={i} className={`move-entry ${i % 2 === 0 ? 'white-move' : 'black-move'}`}>
                {i % 2 === 0 && <span className="move-number">{Math.floor(i / 2) + 1}.</span>}
                {move.san || `${move.from}-${move.to}`}
              </span>
            ))}
          </div>
          <GameControls
            onResign={game.resign}
            onOfferDraw={game.offerDraw}
            onFlipBoard={() => game.setBoardFlipped(!game.boardFlipped)}
            isGameActive={game.gameState.status === 'active'}
          />
        </div>

        {/* Center: board */}
        <div className="game-center">
          <PlayerInfo
            username={topPlayer.username}
            rating={topPlayer.rating}
            time={topTime}
            isActive={topActive && game.gameState.status === 'active'}
            capturedPieces={
              isWhite
                ? game.gameState.board.capturedPieces?.black
                : game.gameState.board.capturedPieces?.white
            }
            isTop
          />

          <ChessBoard
            boardFlipped={game.boardFlipped}
            selectedSquare={game.selectedSquare}
            possibleMoves={game.possibleMoves}
            lastMove={lastMove}
            getPieceAt={game.getPieceAt}
            onSquareClick={game.handleSquareClick}
            decayState={game.decayState}
            frozenPieces={game.frozenPieces}
          />

          <PlayerInfo
            username={bottomPlayer.username}
            rating={bottomPlayer.rating}
            time={bottomTime}
            isActive={bottomActive && game.gameState.status === 'active'}
            capturedPieces={
              isWhite
                ? game.gameState.board.capturedPieces?.white
                : game.gameState.board.capturedPieces?.black
            }
          />
        </div>
      </div>

      {/* Modals */}
      <PromotionModal
        visible={!!game.promotionModal?.visible}
        playerColor={game.playerColor}
        onSelect={game.handlePromotion}
        onCancel={() => {}}
      />

      <GameEndModal
        visible={game.showGameEndModal}
        message={game.gameEndMessage}
        isWinner={game.isWinner}
        details={game.gameEndDetails}
        onClose={() => game.setShowGameEndModal(false)}
        onBackToLobby={() => navigate('/lobby')}
      />
    </div>
  );
};

export default GamePage;
