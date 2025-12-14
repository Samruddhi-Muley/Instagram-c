const API_URL = 'http://localhost:5000/api';
let currentView = 'auth';
let isSignup = false;


//check if user is already logged in
window.onload = () => {
    const token = localStorage.getItem('token');
    if (token) {
        showMainApp();
        showFeed();
    }
};

//login and signup toggle
function toggleAuth() {
    isSignup = !isSignup;
    const title = document.getElementById('auth-title');
    const submitBtn = document.getElementById('auth-submit');
    const switchText = document.getElementById('auth-switch');
    const emailField = document.getElementById('email');
    
    if (isSignup) {
        title.textContent = 'Sign Up';
        submitBtn.textContent = 'Sign Up';
        switchText.innerHTML = 'Already have an account? <a href="#" onclick="toggleAuth()">Login</a>';
        emailField.style.display = 'block';
    } else {
        title.textContent = 'Login';
        submitBtn.textContent = 'Login';
        switchText.innerHTML = 'Don\'t have an account? <a href="#" onclick="toggleAuth()">Sign up</a>';
        emailField.style.display = 'none';
    }
    
    document.getElementById('auth-error').style.display = 'none';
}

//authentication form submit
document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;
    
    const endpoint = isSignup ? '/signup' : '/login';
    const body = isSignup 
        ? { username, email, password }
        : { username, password };
    
    try {
        const response = await fetch(API_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Authentication failed');
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showMainApp();
        showFeed();
    } catch (error) {
        const errorDiv = document.getElementById('auth-error');
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
});


function showMainApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('navbar').style.display = 'flex';
    document.getElementById('main-container').style.display = 'block';
}


function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.reload();
}


async function showFeed() {
    hideAllViews();
    document.getElementById('feed-view').style.display = 'block';
    
    try {
        const response = await fetch(API_URL + '/feed', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        
        const posts = await response.json();
        const feedDiv = document.getElementById('feed-posts');
        
        if (posts.length === 0) {
            feedDiv.innerHTML = '<p style="text-align: center; padding: 40px;">No posts yet. Follow some users to see their posts!</p>';
            return;
        }
        
        feedDiv.innerHTML = posts.map(post => `
            <div class="post-card">
                <div class="post-header">
                    <strong onclick="showProfile(${post.author.id})">@${post.author.username}</strong>
                </div>
                <img src="${post.image_url}" alt="Post" class="post-image">
                <div class="post-actions">
                    <button onclick="toggleLike(${post.id}, ${post.is_liked})">
                        ${post.is_liked ? '❤️' : '🤍'} ${post.likes_count}
                    </button>
                    <button onclick="showPostDetail(${post.id})">
                        💬 ${post.comments_count} comments
                    </button>
                </div>
                <p class="post-caption">
                    <strong>${post.author.username}</strong> ${post.caption || ''}
                </p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading feed:', error);
    }
}


function showCreatePost() {
    hideAllViews();
    document.getElementById('create-post-view').style.display = 'block';
}


// Handle create post
document.getElementById('create-post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const image_url = document.getElementById('image-url').value;
    const caption = document.getElementById('caption').value;
    
    console.log('Attempting to create post:', { image_url, caption });
    console.log('Token:', localStorage.getItem('token'));
    
    try {
        const response = await fetch(API_URL + '/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ image_url, caption })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create post');
        }
        
        document.getElementById('image-url').value = '';
        document.getElementById('caption').value = '';
        document.getElementById('create-error').style.display = 'none';
        showFeed();
    } catch (error) {
        console.error('Full error:', error);
        const errorDiv = document.getElementById('create-error');
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
});

async function toggleLike(postId, isLiked) {
    try {
        const endpoint = isLiked ? '/unlike' : '/like';
        await fetch(API_URL + `/posts/${postId}${endpoint}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        
        showFeed();
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}


async function showProfile(userId) {
    hideAllViews();
    document.getElementById('profile-view').style.display = 'block';
    
    try {
        const response = await fetch(API_URL + `/users/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        
        const profile = await response.json();
        const profileDiv = document.getElementById('profile-content');
        
        profileDiv.innerHTML = `
            <button class="back-button" onclick="showFeed()">← Back to Feed</button>
            <div class="profile-header">
                <div class="profile-info">
                    <h2>@${profile.username}</h2>
                    <button onclick="toggleFollow(${userId}, ${profile.is_following})">
                        ${profile.is_following ? 'Unfollow' : 'Follow'}
                    </button>
                </div>
                <div class="profile-stats">
                    <span><strong>${profile.posts_count}</strong> posts</span>
                    <span><strong>${profile.followers_count}</strong> followers</span>
                    <span><strong>${profile.following_count}</strong> following</span>
                </div>
            </div>
            <div class="profile-posts">
                ${profile.posts.map(post => `
                    <div class="profile-post-thumbnail" onclick="showPostDetail(${post.id})">
                        <img src="${post.image_url}" alt="Post">
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}


async function toggleFollow(userId, isFollowing) {
    try {
        const endpoint = isFollowing ? '/unfollow' : '/follow';
        await fetch(API_URL + `/users/${userId}${endpoint}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        
        showProfile(userId);
    } catch (error) {
        console.error('Error toggling follow:', error);
    }
}


async function showPostDetail(postId) {
    hideAllViews();
    document.getElementById('post-detail-view').style.display = 'block';
    
    try {
        const response = await fetch(API_URL + `/posts/${postId}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        
        const post = await response.json();
        const detailDiv = document.getElementById('post-detail-content');
        
        detailDiv.innerHTML = `
            <button class="back-button" onclick="showFeed()">← Back to Feed</button>
            <div class="post-card">
                <div class="post-header">
                    <strong onclick="showProfile(${post.author.id})">@${post.author.username}</strong>
                </div>
                <img src="${post.image_url}" alt="Post" class="post-image">
                <div class="post-actions">
                    <button onclick="toggleLike(${post.id}, ${post.is_liked})">
                        ${post.is_liked ? '❤️' : '🤍'} ${post.likes_count} likes
                    </button>
                </div>
                <p class="post-caption">${post.caption || ''}</p>
                <div class="comments-section">
                    ${post.comments.map(comment => `
                        <div class="comment">
                            <strong>${comment.author}</strong> ${comment.text}
                        </div>
                    `).join('')}
                </div>
                <form class="comment-form" onsubmit="addComment(event, ${post.id})">
                    <input type="text" id="comment-input-${post.id}" placeholder="Add a comment..." required>
                    <button type="submit">Post</button>
                </form>
            </div>
        `;
    } catch (error) {
        console.error('Error loading post:', error);
    }
}


async function addComment(event, postId) {
    event.preventDefault();
    
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value;
    
    try {
        await fetch(API_URL + `/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ text })
        });
        
        showPostDetail(postId);
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}


function hideAllViews() {
    document.getElementById('feed-view').style.display = 'none';
    document.getElementById('create-post-view').style.display = 'none';
    document.getElementById('profile-view').style.display = 'none';
    document.getElementById('post-detail-view').style.display = 'none';
}