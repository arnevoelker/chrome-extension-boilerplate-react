import './content.styles.css';

console.log('LinkedEx: Content script loaded');

// Reaction types for Signal Collection
const SIGNAL_REACTIONS = [
  { type: 'love', emoji: '😍', label: 'Love this' },
  { type: 'disagree', emoji: '😤', label: 'Disagree' },
  { type: 'interesting', emoji: '🤔', label: 'Interesting' },
  { type: 'inspiring', emoji: '💡', label: 'Inspiring' },
  { type: 'competitor', emoji: '🎯', label: 'Competitor' }
];

// Craft types for Format Collection
const CRAFT_REACTIONS = [
  { type: 'format', emoji: '✨', label: 'Brilliant format' },
  { type: 'storytelling', emoji: '🎭', label: 'Great storytelling' },
  { type: 'visual', emoji: '🎨', label: 'Visual genius' },
  { type: 'structure', emoji: '🏗️', label: 'Perfect structure' },
  { type: 'style', emoji: '💅', label: 'Stylistic gold' },
  { type: 'hook', emoji: '🪝', label: 'Hook mastery' }
];

class LinkedExInjector {
  constructor() {
    this.processedPosts = new Set();
    this.captureMode = 'signal'; // or 'craft'
    this.init();
  }

  init() {
    // Start observing for new posts
    this.observePosts();
    // Process existing posts
    this.processExistingPosts();
    // Listen for keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  observePosts() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            this.findAndProcessPosts(node);
          }
        });
      });
    });

    // Start observing the feed
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  processExistingPosts() {
    this.findAndProcessPosts(document.body);
  }

  findAndProcessPosts(container) {
    // LinkedIn post selectors (may need updating based on LinkedIn's current structure)
    const postSelectors = [
      '[data-id^="urn:li:activity"]',
      '[data-urn^="urn:li:activity"]',
      '.feed-shared-update-v2',
      '.occludable-update'
    ];

    postSelectors.forEach(selector => {
      const posts = container.querySelectorAll ? 
        container.querySelectorAll(selector) : 
        (container.matches && container.matches(selector) ? [container] : []);
      
      posts.forEach(post => this.injectButtons(post));
    });
  }

  injectButtons(postElement) {
    // Check if we've already processed this post
    const postId = this.getPostId(postElement);
    if (!postId || this.processedPosts.has(postId)) return;
    this.processedPosts.add(postId);

    // Find the action bar (where like, comment, repost buttons are)
    const actionBar = postElement.querySelector('.social-actions-bar, [data-test-id="social-actions"], .feed-shared-social-actions');
    if (!actionBar) return;

    // Create LinkedEx button container
    const linkedExContainer = document.createElement('div');
    linkedExContainer.className = 'linkedex-container';
    linkedExContainer.innerHTML = `
      <div class="linkedex-buttons">
        <span class="linkedex-brand" title="LinkedEx - Content Intelligence">
          <span style="color: #0077b5; font-weight: 700; font-size: 11px; opacity: 0.7;">ex</span>
        </span>
        <button class="linkedex-mode-toggle" title="Toggle between Signal and Craft mode">
          ${this.captureMode === 'signal' ? '💭 Signals' : '🎨 Craft'}
        </button>
        <div class="linkedex-reactions ${this.captureMode}">
          ${this.renderReactionButtons()}
        </div>
      </div>
    `;

    // Insert after the action bar
    actionBar.parentNode.insertBefore(linkedExContainer, actionBar.nextSibling);

    // Add event listeners
    this.attachEventListeners(linkedExContainer, postElement);
  }

  renderReactionButtons() {
    const reactions = this.captureMode === 'signal' ? SIGNAL_REACTIONS : CRAFT_REACTIONS;
    return reactions.map(r => `
      <button class="linkedex-reaction-btn" data-type="${r.type}" title="${r.label}">
        ${r.emoji}
      </button>
    `).join('');
  }

  attachEventListeners(container, postElement) {
    // Mode toggle
    const modeToggle = container.querySelector('.linkedex-mode-toggle');
    modeToggle.addEventListener('click', () => {
      this.captureMode = this.captureMode === 'signal' ? 'craft' : 'signal';
      modeToggle.textContent = this.captureMode === 'signal' ? '💭 Signals' : '🎨 Craft';
      container.querySelector('.linkedex-reactions').className = `linkedex-reactions ${this.captureMode}`;
      container.querySelector('.linkedex-reactions').innerHTML = this.renderReactionButtons();
      this.attachReactionListeners(container, postElement);
    });

    // Reaction buttons
    this.attachReactionListeners(container, postElement);
  }

  attachReactionListeners(container, postElement) {
    container.querySelectorAll('.linkedex-reaction-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleReaction(btn.dataset.type, postElement);
      });
    });
  }

  handleReaction(reactionType, postElement) {
    const postData = this.extractPostData(postElement);
    
    // Show capture modal
    this.showCaptureModal(reactionType, postData, (captureData) => {
      // Save to storage
      this.saveCapture({
        ...postData,
        reaction: reactionType,
        captureMode: this.captureMode,
        ...captureData,
        timestamp: new Date().toISOString()
      });
    });
  }

  extractPostData(postElement) {
    // Extract post content
    const textElement = postElement.querySelector('.feed-shared-text, .break-words');
    const content = textElement ? textElement.innerText : '';
    
    // Extract author info
    const authorElement = postElement.querySelector('.feed-shared-actor__name, .update-components-actor__name');
    const authorName = authorElement ? authorElement.innerText : 'Unknown';
    
    // Extract metrics
    const likes = postElement.querySelector('[data-test-id="social-actions__reaction-count"], .social-counts-reactions__count')?.innerText || '0';
    const comments = postElement.querySelector('[data-test-id="social-actions__comment-count"], .social-counts-comments')?.innerText || '0';
    
    // Get post URL
    const linkElement = postElement.querySelector('[data-test-id="social-actions__share-permalink"], .feed-shared-control-menu__trigger');
    const postUrl = linkElement ? linkElement.href : window.location.href;
    
    return {
      postId: this.getPostId(postElement),
      content,
      authorName,
      postUrl,
      metrics: {
        likes,
        comments
      }
    };
  }

  getPostId(postElement) {
    return postElement.dataset.id || 
           postElement.dataset.urn || 
           postElement.getAttribute('data-id') || 
           postElement.getAttribute('data-urn') ||
           `post-${Date.now()}`;
  }

  showCaptureModal(reactionType, postData, callback) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'linkedex-modal-overlay';
    modal.innerHTML = `
      <div class="linkedex-modal">
        <div class="linkedex-modal-header">
          <h3>${this.captureMode === 'signal' ? '💭 Capture Your Reaction' : '🎨 Capture Technique'}</h3>
          <button class="linkedex-modal-close">×</button>
        </div>
        <div class="linkedex-modal-body">
          <div class="linkedex-post-preview">
            <strong>${postData.authorName}</strong>
            <p>${postData.content.substring(0, 200)}${postData.content.length > 200 ? '...' : ''}</p>
          </div>
          
          ${this.captureMode === 'signal' ? `
            <div class="linkedex-form-group">
              <label>Your gut reaction:</label>
              <textarea class="linkedex-gut-reaction" placeholder="What's your honest, unfiltered reaction?" rows="3"></textarea>
            </div>
            <div class="linkedex-form-group">
              <label>Why this matters to you:</label>
              <input type="text" class="linkedex-why-matters" placeholder="Personal relevance...">
            </div>
            <div class="linkedex-form-group">
              <label>
                <input type="checkbox" class="linkedex-is-private">
                This is a private opinion I wouldn't share publicly
              </label>
            </div>
          ` : `
            <div class="linkedex-form-group">
              <label>What technique works here?</label>
              <textarea class="linkedex-technique" placeholder="Break down what makes this effective..." rows="3"></textarea>
            </div>
            <div class="linkedex-form-group">
              <label>How could you apply this?</label>
              <input type="text" class="linkedex-application" placeholder="Where would this work for your content?">
            </div>
            <div class="linkedex-form-group">
              <label>Rating:</label>
              <div class="linkedex-rating">
                ${[1,2,3,4,5].map(n => `<button class="linkedex-star" data-rating="${n}">⭐</button>`).join('')}
              </div>
            </div>
          `}
          
          <div class="linkedex-form-group">
            <label>Tags (comma-separated):</label>
            <input type="text" class="linkedex-tags" placeholder="e.g., AI, leadership, technical">
          </div>
        </div>
        <div class="linkedex-modal-footer">
          <button class="linkedex-cancel">Cancel</button>
          <button class="linkedex-save">Save Capture</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus first input
    setTimeout(() => {
      const firstInput = modal.querySelector('textarea, input[type="text"]');
      if (firstInput) firstInput.focus();
    }, 100);
    
    // Handle rating stars
    if (this.captureMode === 'craft') {
      let selectedRating = 0;
      modal.querySelectorAll('.linkedex-star').forEach(star => {
        star.addEventListener('click', () => {
          selectedRating = parseInt(star.dataset.rating);
          modal.querySelectorAll('.linkedex-star').forEach((s, i) => {
            s.classList.toggle('selected', i < selectedRating);
          });
        });
      });
    }
    
    // Handle save
    modal.querySelector('.linkedex-save').addEventListener('click', () => {
      const captureData = this.captureMode === 'signal' ? {
        gutReaction: modal.querySelector('.linkedex-gut-reaction').value,
        whyMatters: modal.querySelector('.linkedex-why-matters').value,
        isPrivate: modal.querySelector('.linkedex-is-private').checked,
        tags: modal.querySelector('.linkedex-tags').value.split(',').map(t => t.trim()).filter(t => t)
      } : {
        technique: modal.querySelector('.linkedex-technique').value,
        application: modal.querySelector('.linkedex-application').value,
        rating: modal.querySelectorAll('.linkedex-star.selected').length || 0,
        tags: modal.querySelector('.linkedex-tags').value.split(',').map(t => t.trim()).filter(t => t)
      };
      
      callback(captureData);
      document.body.removeChild(modal);
      this.showToast('✅ Captured successfully!');
    });
    
    // Handle cancel/close
    const closeModal = () => document.body.removeChild(modal);
    modal.querySelector('.linkedex-cancel').addEventListener('click', closeModal);
    modal.querySelector('.linkedex-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  saveCapture(data) {
    // Save to chrome.storage
    chrome.storage.local.get(['captures'], (result) => {
      const captures = result.captures || [];
      captures.unshift(data); // Add to beginning
      
      // Keep only last 100 captures in local storage
      if (captures.length > 100) {
        captures.length = 100;
      }
      
      chrome.storage.local.set({ captures }, () => {
        console.log('LinkedEx: Capture saved', data);
      });
    });
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'linkedex-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt+S for Signal mode, Alt+C for Craft mode
      if (e.altKey && e.key === 's') {
        this.captureMode = 'signal';
        this.showToast('Switched to Signal mode');
      } else if (e.altKey && e.key === 'c') {
        this.captureMode = 'craft';
        this.showToast('Switched to Craft mode');
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new LinkedExInjector());
} else {
  new LinkedExInjector();
}