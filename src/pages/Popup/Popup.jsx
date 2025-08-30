import React, { useState, useEffect } from 'react';
import './Popup.css';

const Popup = () => {
  const [captures, setCaptures] = useState([]);
  const [activeTab, setActiveTab] = useState('signals');
  const [stats, setStats] = useState({ signals: 0, crafts: 0 });

  useEffect(() => {
    // Load captures from storage
    loadCaptures();
    
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.captures) {
        loadCaptures();
      }
    });
  }, []);

  const loadCaptures = () => {
    chrome.storage.local.get(['captures'], (result) => {
      const allCaptures = result.captures || [];
      setCaptures(allCaptures);
      
      // Calculate stats
      const signalCount = allCaptures.filter(c => c.captureMode === 'signal').length;
      const craftCount = allCaptures.filter(c => c.captureMode === 'craft').length;
      setStats({ signals: signalCount, crafts: craftCount });
    });
  };

  const filteredCaptures = captures.filter(c => 
    activeTab === 'signals' ? c.captureMode === 'signal' : c.captureMode === 'craft'
  );

  const clearCaptures = () => {
    if (window.confirm('Clear all captures? This cannot be undone.')) {
      chrome.storage.local.set({ captures: [] }, () => {
        loadCaptures();
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show brief success indicator
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = '✓';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getReactionEmoji = (reaction) => {
    const emojiMap = {
      love: '😍',
      disagree: '😤',
      interesting: '🤔',
      inspiring: '💡',
      competitor: '🎯',
      format: '✨',
      storytelling: '🎭',
      visual: '🎨',
      structure: '🏗️',
      style: '💅',
      hook: '🪝'
    };
    return emojiMap[reaction] || '📌';
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="header-logo">
          <span className="logo-text">LinkedEx</span>
        </div>
        <div className="header-stats">
          <span className="stat">💭 {stats.signals}</span>
          <span className="stat">🎨 {stats.crafts}</span>
        </div>
      </header>

      <div className="popup-tabs">
        <button 
          className={`tab ${activeTab === 'signals' ? 'active' : ''}`}
          onClick={() => setActiveTab('signals')}
        >
          Signals ({stats.signals})
        </button>
        <button 
          className={`tab ${activeTab === 'crafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('crafts')}
        >
          Craft ({stats.crafts})
        </button>
      </div>

      <div className="popup-content">
        {filteredCaptures.length === 0 ? (
          <div className="empty-state">
            <p className="empty-emoji">{activeTab === 'signals' ? '💭' : '🎨'}</p>
            <p className="empty-text">
              No {activeTab} captured yet
            </p>
            <p className="empty-hint">
              Visit LinkedIn to start capturing {activeTab === 'signals' ? 'reactions' : 'techniques'}
            </p>
          </div>
        ) : (
          <div className="captures-list">
            {filteredCaptures.slice(0, 10).map((capture, index) => (
              <div key={index} className="capture-card">
                <div className="capture-header">
                  <span className="capture-reaction">
                    {getReactionEmoji(capture.reaction)}
                  </span>
                  <span className="capture-author">{capture.authorName}</span>
                  <span className="capture-time">{formatDate(capture.timestamp)}</span>
                </div>
                
                <div className="capture-content">
                  <p className="post-excerpt">
                    {capture.content.substring(0, 100)}...
                  </p>
                  
                  {activeTab === 'signals' && capture.gutReaction && (
                    <div className="capture-reaction-text">
                      <strong>Your reaction:</strong> {capture.gutReaction}
                      {capture.isPrivate && <span className="private-badge">🔒 Private</span>}
                    </div>
                  )}
                  
                  {activeTab === 'crafts' && capture.technique && (
                    <div className="capture-technique">
                      <strong>Technique:</strong> {capture.technique}
                      {capture.rating > 0 && (
                        <div className="rating">
                          {'⭐'.repeat(capture.rating)}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {capture.tags && capture.tags.length > 0 && (
                    <div className="capture-tags">
                      {capture.tags.map((tag, i) => (
                        <span key={i} className="tag">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="capture-actions">
                  <button 
                    className="action-btn"
                    onClick={() => window.open(capture.postUrl, '_blank')}
                  >
                    View Post
                  </button>
                  <button 
                    className="action-btn"
                    onClick={(e) => {
                      e.target.textContent = '✓';
                      navigator.clipboard.writeText(
                        activeTab === 'signals' ? capture.gutReaction : capture.technique
                      );
                      setTimeout(() => {
                        e.target.textContent = 'Copy';
                      }, 1000);
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="popup-footer">
        <button 
          className="footer-btn"
          onClick={() => chrome.tabs.create({ url: 'options.html' })}
        >
          ⚙️ Settings
        </button>
        <button 
          className="footer-btn"
          onClick={clearCaptures}
        >
          🗑️ Clear All
        </button>
        <button 
          className="footer-btn"
          onClick={() => chrome.tabs.create({ url: 'https://linkedin.com/feed' })}
        >
          🔗 LinkedIn
        </button>
      </footer>
    </div>
  );
};

export default Popup;