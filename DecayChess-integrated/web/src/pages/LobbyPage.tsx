import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, clearAuth } from '../lib/api';
import { useSocket } from '../hooks/useSocket';

const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [inQueue, setInQueue] = useState(false);
  const [queueCounts, setQueueCounts] = useState<any>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [searchInterval, setSearchIntervalState] = useState<any>(null);

  if (!user) {
    navigate('/');
    return null;
  }

  const { emit, on } = useSocket({
    namespace: '/matchmaking',
    auth: { userId: user._id },
  });

  // Listen for match found
  useEffect(() => {
    const unsub: (() => void)[] = [];

    unsub.push(on('queue:matchFound', (data: any) => {
      console.log('[Lobby] Match found!', data);
      setInQueue(false);
      // Navigate to game with the session data
      navigate('/game', { state: { gameState: data.gameState, userId: user._id } });
    }));

    unsub.push(on('queue:live_counts', (data: any) => {
      setQueueCounts(data);
    }));

    unsub.push(on('queue:left', () => {
      setInQueue(false);
    }));

    unsub.push(on('queue:error', (data: any) => {
      console.error('[Lobby] Queue error:', data);
      setInQueue(false);
    }));

    return () => { unsub.forEach(fn => fn()); };
  }, [on, navigate, user._id]);

  // Search timer
  useEffect(() => {
    if (inQueue) {
      const interval = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
      setSearchIntervalState(interval);
      return () => clearInterval(interval);
    } else {
      setSearchTime(0);
      if (searchInterval) clearInterval(searchInterval);
    }
  }, [inQueue]);

  const joinQueue = useCallback(() => {
    emit('queue:join', { variant: 'decay' });
    setInQueue(true);
  }, [emit]);

  const leaveQueue = useCallback(() => {
    emit('queue:leave');
    setInQueue(false);
  }, [emit]);

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  return (
    <div className="page lobby-page">
      <div className="lobby-container">
        {/* Header */}
        <div className="lobby-header">
          <div className="lobby-title-row">
            <h1 className="lobby-title">♛ DecayChess</h1>
            <button className="btn btn-ghost btn-small" onClick={handleLogout}>
              Logout
            </button>
          </div>
          <div className="user-info-bar">
            <span className="user-name">{user.name || user.username || 'Player'}</span>
            {user.ratings !== undefined && <span className="user-rating">⭐ {user.ratings}</span>}
            {(user.win !== undefined || user.lose !== undefined) && (
              <span className="user-record">W: {user.win || 0} / L: {user.lose || 0}</span>
            )}
          </div>
        </div>

        {/* Game Mode Card */}
        <div className="mode-card">
          <div className="mode-card-header">
            <span className="mode-icon">⏳</span>
            <div>
              <h2 className="mode-name">Decay Mode</h2>
              <p className="mode-desc">3+2 • Pieces decay and freeze over time</p>
            </div>
          </div>

          <div className="mode-rules">
            <div className="rule-item">
              <span className="rule-icon">♛</span>
              <span>Queen gets 25s timer on first move</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">❄</span>
              <span>Timer expires → piece freezes forever</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">♜</span>
              <span>After queen freezes, major pieces start decaying (20s)</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">⏱</span>
              <span>Moving a decaying piece adds +2s</span>
            </div>
          </div>

          {/* Queue Button */}
          {!inQueue ? (
            <button className="btn btn-primary btn-full btn-large" onClick={joinQueue}>
              ⚔ Find Match
            </button>
          ) : (
            <div className="queue-status">
              <div className="searching-animation">
                <div className="search-dot"></div>
                <div className="search-dot"></div>
                <div className="search-dot"></div>
              </div>
              <p className="search-text">
                Searching for opponent... <span className="search-time">{searchTime}s</span>
              </p>
              <button className="btn btn-ghost btn-full" onClick={leaveQueue}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
