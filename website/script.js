/**
 * Sachintha Dissanayaka - Modern Profile Interactivity
 * Handles Theme Toggling, Dynamic Host/IP Detection, Likes, Post Creation, and Tab Navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Host / IP Detection for Live Cloud Status Card
    const ipDisplay = document.getElementById('ipDisplay');
    if (ipDisplay) {
        const host = window.location.hostname || 'localhost';
        ipDisplay.textContent = host === 'localhost' || host === '127.0.0.1' 
            ? 'Local Test Node' 
            : `AWS Node (${host})`;
    }

    // 2. Dark / Light Theme Toggle with LocalStorage
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const rootHtml = document.documentElement;

    const savedTheme = localStorage.getItem('fb_theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    rootHtml.setAttribute('data-theme', savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = rootHtml.getAttribute('data-theme');
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            rootHtml.setAttribute('data-theme', nextTheme);
            localStorage.setItem('fb_theme', nextTheme);
        });
    }

    // 3. Like Button Toggle & Counter Increment
    const likeButtons = document.querySelectorAll('.like-btn');
    likeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const isLiked = btn.classList.toggle('liked');
            const postId = btn.getAttribute('data-post-id');
            const countElem = document.getElementById(`post${postId}-like-count`);

            if (countElem) {
                let count = parseInt(countElem.textContent.replace(/,/g, ''), 10) || 0;
                if (isLiked) {
                    count += 1;
                } else {
                    count = Math.max(0, count - 1);
                }
                countElem.textContent = count;
            }
        });
    });

    // 4. Create Post Box Functionality
    const createPostInput = document.getElementById('createPostInput');
    const publishPostBtn = document.getElementById('publishPostBtn');
    const postsFeedContainer = document.getElementById('postsFeedContainer');

    if (createPostInput && publishPostBtn) {
        createPostInput.addEventListener('focus', () => {
            publishPostBtn.style.display = 'inline-flex';
        });

        createPostInput.addEventListener('input', () => {
            publishPostBtn.disabled = !createPostInput.value.trim();
        });

        publishPostBtn.addEventListener('click', () => {
            const content = createPostInput.value.trim();
            if (!content) return;

            const newPostArticle = document.createElement('article');
            newPostArticle.className = 'fb-card post-card';
            newPostArticle.style.animation = 'slideDown 0.35s ease-out';

            const newPostId = Date.now();

            newPostArticle.innerHTML = `
                <div class="post-header">
                    <div class="post-author-avatar-wrap">
                        <img src="assets/profile.jpg" alt="Sachintha Dissanayaka" class="user-avatar-small">
                        <span class="post-online-dot"></span>
                    </div>
                    <div class="post-author-meta">
                        <div class="author-title-row">
                            <h3 class="post-author-name">Sachintha Dissanayaka</h3>
                            <span class="verified-badge-mini" title="Verified">✓</span>
                        </div>
                        <span class="post-time">
                            <span>Just now</span>
                            <span class="dot-separator">•</span>
                            <span title="Public">🌍 Public</span>
                        </span>
                    </div>
                    <button class="post-menu-btn" aria-label="Post Options">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="5" cy="12" r="2"></circle>
                            <circle cx="12" cy="12" r="2"></circle>
                            <circle cx="19" cy="12" r="2"></circle>
                        </svg>
                    </button>
                </div>

                <div class="post-content">
                    <p>${escapeHtml(content)}</p>
                </div>

                <div class="post-stats-row">
                    <div class="reactions-badge-group">
                        <span class="reaction-bubble icon-like">👍</span>
                        <span class="reactions-count-text" id="post${newPostId}-like-count">1</span>
                    </div>
                    <div class="comments-shares-stats">
                        <span class="stat-link">0 comments</span>
                    </div>
                </div>

                <hr class="card-divider">

                <div class="post-action-bar">
                    <button class="feed-btn like-btn liked" data-post-id="${newPostId}">
                        <svg class="action-btn-icon like-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                        </svg>
                        <span>Like</span>
                    </button>
                    <button class="feed-btn comment-btn">
                        <svg class="action-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                        <span>Comment</span>
                    </button>
                    <button class="feed-btn share-btn">
                        <svg class="action-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                        <span>Share</span>
                    </button>
                </div>
            `;

            // Bind new like button
            const newLikeBtn = newPostArticle.querySelector('.like-btn');
            newLikeBtn.addEventListener('click', () => {
                const isLiked = newLikeBtn.classList.toggle('liked');
                const countElem = document.getElementById(`post${newPostId}-like-count`);
                if (countElem) {
                    let count = parseInt(countElem.textContent, 10) || 0;
                    countElem.textContent = isLiked ? count + 1 : Math.max(0, count - 1);
                }
            });

            postsFeedContainer.prepend(newPostArticle);
            createPostInput.value = '';
            publishPostBtn.style.display = 'none';
        });
    }

    // 5. Tab Navigation
    const tabLinks = document.querySelectorAll('.profile-nav-tabs .tab-link');
    tabLinks.forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (tab.classList.contains('dropdown-toggle')) return;
            tabLinks.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            const tabName = tab.getAttribute('data-tab');
            if (tabName === 'about') {
                const introCard = document.querySelector('.intro-card');
                if (introCard) introCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (tabName === 'friends') {
                const friendsCard = document.querySelector('.friends-card');
                if (friendsCard) friendsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (tabName === 'photos') {
                const photosCard = document.querySelector('.photos-card');
                if (photosCard) photosCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (tabName === 'posts') {
                window.scrollTo({ top: 380, behavior: 'smooth' });
            }
        });
    });

    // Helper: Escape HTML to avoid XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
