// Main application logic and UI handlers
import { 
    signUp, 
    signIn, 
    logout, 
    onAuthChange, 
    saveStory, 
    saveGame, 
    saveChat, 
    getUserData, 
    getUserHistory, 
    savePublicStory, // Added savePublicStory
    getStoryById, // Added getStoryById
    getGameById, // Added getGameById
    getChatById // Added getChatById
} from './firebase.js';

import { 
    generateStoryCandidates, 
    generateGameConcept, 
    getEducationalResponse 
} from './gemini.js';

// Global state
let currentUser = null;
let currentStory = '';
let currentGame = '';
let storyCharacters = [];
let gameCharacters = [];
let currentSessionId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if we're on the index page
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        initializeIndexPage();
    } else if (window.location.pathname.endsWith('dashboard.html')) {
        initializeDashboard();
    } else if (window.location.pathname.endsWith('stories.html')) {
        initializeStoriesPage();
    } else if (window.location.pathname.endsWith('gaming.html')) {
        initializeGamingPage();
    } else if (window.location.pathname.endsWith('education.html')) {
        initializeEducationPage();
    }

    // Set up auth state listener
    onAuthChange((user) => {
        currentUser = user;
        if (user) {
            console.log('User authenticated:', user.uid);
            updateUserDisplay(user);
        } else {
            console.log('User not authenticated');
            // Redirect to index if not on index page
            if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
                window.location.href = 'index.html';
            }
        }
    });
}

// Index page initialization
function initializeIndexPage() {
    // Start splash screen animation
    setTimeout(() => {
        const splashScreen = document.getElementById('splash-screen');
        const authContainer = document.getElementById('auth-container');
        
        if (splashScreen && authContainer) {
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                splashScreen.style.display = 'none';
                authContainer.classList.add('active');
            }, 800);
        }
    }, 2000);

    // Set up auth form handlers
    setupAuthForms();
}

function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const authError = document.getElementById('auth-error');

    // Toggle between login and signup
    if (showSignup) {
        showSignup.addEventListener('click', () => {
            loginForm.classList.remove('active');
            signupForm.classList.add('active');
            authTitle.textContent = 'Create Account';
            authSubtitle.textContent = 'Join us to start your AI journey';
            authError.classList.remove('active');
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', () => {
            signupForm.classList.remove('active');
            loginForm.classList.add('active');
            authTitle.textContent = 'Welcome Back';
            authSubtitle.textContent = 'Sign in to continue your journey';
            authError.classList.remove('active');
        });
    }

    // Handle login form
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const result = await signIn(email, password);
            if (result.success) {
                window.location.href = 'dashboard.html';
            } else {
                showAuthError(result.error);
            }
        });
    }

    // Handle signup form
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm').value;

            // Client-side validation
            if (!validateEmail(email)) {
                showAuthError('Please enter a valid email address.');
                return;
            }

            if (password !== confirmPassword) {
                showAuthError('Passwords do not match.');
                return;
            }

            if (password.length < 6) {
                showAuthError('Password must be at least 6 characters long.');
                return;
            }

            const result = await signUp(email, password, name);
            if (result.success) {
                window.location.href = 'dashboard.html';
            } else {
                showAuthError(result.error);
            }
        });
    }
}

function showAuthError(message) {
    const authError = document.getElementById('auth-error');
    if (authError) {
        authError.textContent = message;
        authError.classList.add('active');
        setTimeout(() => {
            authError.classList.remove('active');
        }, 5000);
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Dashboard initialization
function initializeDashboard() {
    // Set up navigation
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    dashboardCards.forEach(card => {
        card.addEventListener('click', () => {
            const page = card.getAttribute('data-page');
            if (page) {
                window.location.href = page;
            }
        });
    });

    // Load user history
    loadDashboardHistory();

    // Set up logout
    setupLogout();
}

async function loadDashboardHistory() {
    if (!currentUser) return;

    try {
        const result = await getUserHistory(currentUser.uid);
        if (result.success) {
            displayRecentItems(result.data.slice(0, 6)); // Show last 6 items
            displayRecentStories(result.data.filter(item => item.type === 'story').slice(0, 3));
            displayRecentGames(result.data.filter(item => item.type === 'game').slice(0, 3));
            displayRecentEducation(result.data.filter(item => item.type === 'chat').slice(0, 3));
        }
        
        // Load shared stories
        loadSharedStories();
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Function to load shared stories
async function loadSharedStories() {
    try {
        // For now, we'll show a placeholder. In a real implementation,
        // you would fetch shared stories from the database
        const sharedStoriesContainer = document.getElementById('shared-stories');
        if (sharedStoriesContainer) {
            sharedStoriesContainer.innerHTML = `
                <div class="shared-story-card">
                    <div class="shared-story-content">
                        <h4>Welcome to Story Sharing!</h4>
                        <p>Create and share your stories to see them appear here.</p>
                        <div class="shared-story-meta">
                            <span>📚 Community</span>
                            <span>🌟 New Feature</span>
                        </div>
                    </div>
                    <div class="shared-story-action">
                        <a href="stories.html" class="create-story-btn">Create Story</a>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading shared stories:', error);
    }
}

function displayRecentItems(items) {
    const container = document.getElementById('recent-items');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400">No recent activity</p>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="recent-item" onclick="window.app.openRecentItem('${item.type}', '${item.id}')">
            <h4>${item.title || `${item.type} - ${new Date(item.createdAt).toLocaleDateString()}`}</h4>
            <p>${item.genre || item.gameType || 'Chat'} • ${timeAgo(item.createdAt)}</p>
        </div>
    `).join('');
}

function displayRecentStories(stories) {
    const container = document.getElementById('recent-stories');
    if (!container) return;

    if (stories.length === 0) {
        container.innerHTML = '<p class="no-activity">No stories created yet</p>';
        return;
    }

    container.innerHTML = stories.map(story => `
        <div class="activity-item" onclick="window.app.openStory('${story.id}')">
            <div class="activity-item-content">
                <h5>${story.title || 'Untitled Story'}</h5>
                <p>${story.genre || 'Unknown Genre'} • ${timeAgo(story.createdAt)}</p>
            </div>
            <div class="activity-item-action">
                <span>📖</span>
            </div>
        </div>
    `).join('');
}

function displayRecentGames(games) {
    const container = document.getElementById('recent-games');
    if (!container) return;

    if (games.length === 0) {
        container.innerHTML = '<p class="no-activity">No games created yet</p>';
        return;
    }

    container.innerHTML = games.map(game => `
        <div class="activity-item" onclick="window.app.openGame('${game.id}')">
            <div class="activity-item-content">
                <h5>${game.title || 'Untitled Game'}</h5>
                <p>${game.gameType || 'Unknown Type'} • ${timeAgo(game.createdAt)}</p>
            </div>
            <div class="activity-item-action">
                <span>🎮</span>
            </div>
        </div>
    `).join('');
}

function displayRecentEducation(chats) {
    const container = document.getElementById('recent-learning');
    if (!container) return;

    if (chats.length === 0) {
        container.innerHTML = '<p class="no-activity">No learning sessions yet</p>';
        return;
    }

    container.innerHTML = chats.map(chat => `
        <div class="activity-item" onclick="window.app.openEducation('${chat.id}')">
            <div class="activity-item-content">
                <h5>${chat.title || 'Learning Session'}</h5>
                <p>${chat.subject || 'General'} • ${timeAgo(chat.createdAt)}</p>
            </div>
            <div class="activity-item-action">
                <span>🎓</span>
            </div>
        </div>
    `).join('');
}

// Function to open recent items
function openRecentItem(type, id) {
    switch (type) {
        case 'story':
            openStory(id);
            break;
        case 'game':
            openGame(id);
            break;
        case 'chat':
            openEducation(id);
            break;
        default:
            console.log('Unknown item type:', type);
    }
}

// Function to open a specific story
async function openStory(storyId) {
    try {
        // Navigate to stories page with story ID
        window.location.href = `stories.html?story=${storyId}`;
    } catch (error) {
        console.error('Error opening story:', error);
        showMessage('Error opening story', 'error');
    }
}

// Function to open a specific game
async function openGame(gameId) {
    try {
        // Navigate to gaming page with game ID
        window.location.href = `gaming.html?game=${gameId}`;
    } catch (error) {
        console.error('Error opening game:', error);
        showMessage('Error opening game', 'error');
    }
}

// Function to open a specific education session
async function openEducation(chatId) {
    try {
        // Navigate to education page with chat ID
        window.location.href = `education.html?chat=${chatId}`;
    } catch (error) {
        console.error('Error opening education session:', error);
        showMessage('Error opening education session', 'error');
    }
}

// Function to load a saved story
async function loadSavedStory(storyId) {
    try {
        const result = await getStoryById(currentUser.uid, storyId);
        if (result.success) {
            const story = result.data;
            
            // Populate the form fields
            if (story.genre) {
                const genreSelect = document.getElementById('genre-select');
                if (genreSelect) {
                    genreSelect.value = story.genre;
                }
            }
            
            if (story.characters && Array.isArray(story.characters)) {
                storyCharacters = [...story.characters];
                updateCharacterList();
            }
            
            if (story.prompt) {
                const promptInput = document.getElementById('story-prompt');
                if (promptInput) {
                    promptInput.value = story.prompt;
                }
            }
            
            if (story.content) {
                currentStory = story.content;
                displayStory();
                showMessage('Story loaded successfully!', 'success');
            }
        } else {
            showMessage('Story not found', 'error');
        }
    } catch (error) {
        console.error('Error loading story:', error);
        showMessage('Error loading story', 'error');
    }
}

// Function to load a saved game
async function loadSavedGame(gameId) {
    try {
        const result = await getGameById(currentUser.uid, gameId);
        if (result.success) {
            const game = result.data;
            
            // Populate the form fields
            if (game.gameType) {
                const gameTypeSelect = document.getElementById('game-type-select');
                if (gameTypeSelect) {
                    gameTypeSelect.value = game.gameType;
                }
            }
            
            if (game.characters && Array.isArray(game.characters)) {
                gameCharacters = [...game.characters];
                updateGameCharacterList();
            }
            
            if (game.prompt) {
                const promptInput = document.getElementById('game-prompt');
                if (promptInput) {
                    promptInput.value = game.prompt;
                }
            }
            
            if (game.content) {
                currentGame = game.content;
                displayGame();
                showMessage('Game loaded successfully!', 'success');
            }
        } else {
            showMessage('Game not found', 'error');
        }
    } catch (error) {
        console.error('Error loading game:', error);
        showMessage('Error loading game', 'error');
    }
}

// Function to load a saved chat
async function loadSavedChat(chatId) {
    try {
        const result = await getChatById(currentUser.uid, chatId);
        if (result.success) {
            const chat = result.data;
            
            // Populate the chat history
            if (chat.messages && Array.isArray(chat.messages)) {
                // Clear existing messages
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages) {
                    chatMessages.innerHTML = '';
                    
                    // Add each message
                    chat.messages.forEach(message => {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = `chat-message ${message.role}-message`;
                        messageDiv.innerHTML = `
                            <div class="message-content">
                                <p>${message.content}</p>
                            </div>
                        `;
                        chatMessages.appendChild(messageDiv);
                    });
                    
                    // Scroll to bottom
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
            
            showMessage('Chat history loaded successfully!', 'success');
        } else {
            showMessage('Chat not found', 'error');
        }
    } catch (error) {
        console.error('Error loading chat:', error);
        showMessage('Error loading chat', 'error');
    }
}

function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

// Stories page initialization
function initializeStoriesPage() {
    setupNavigation();
    setupCharacterManager();
    setupStoryGenerator();
    setupStorySaveControls();
    setupStoryEditorAI();
    setupTextToSpeech();
    setupLogout();
    
    // Check if we need to load a specific story
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('story');
    if (storyId) {
        loadSavedStory(storyId);
    }
}

function setupCharacterManager() {
    const addCharacterBtn = document.getElementById('add-character');
    const characterInput = document.getElementById('character-input');
    const characterList = document.getElementById('character-list');

    if (addCharacterBtn && characterInput) {
        addCharacterBtn.addEventListener('click', () => {
            const name = characterInput.value.trim();
            if (name && !storyCharacters.includes(name)) {
                storyCharacters.push(name);
                updateCharacterList();
                characterInput.value = '';
            }
        });

        characterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addCharacterBtn.click();
            }
        });
    }

    function updateCharacterList() {
        if (!characterList) return;
        
        characterList.innerHTML = storyCharacters.map(character => `
            <div class="character-item">
                <span class="character-name">${character}</span>
                <button class="remove-character" data-character="${character}">×</button>
            </div>
        `).join('');

        // Add remove handlers
        characterList.querySelectorAll('.remove-character').forEach(btn => {
            btn.addEventListener('click', () => {
                const character = btn.getAttribute('data-character');
                storyCharacters = storyCharacters.filter(c => c !== character);
                updateCharacterList();
            });
        });
    }
}

function setupStoryGenerator() {
    const generateBtn = document.getElementById('generate-story');
    const genreSelect = document.getElementById('genre-select');
    const storyPrompt = document.getElementById('story-prompt');

    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const genre = genreSelect?.value || 'adventure';
            const prompt = storyPrompt?.value.trim() || 'Continue the story';

            if (storyCharacters.length === 0) {
                showMessage('Please add at least one character to your story.', 'error');
                return;
            }

            try {
                generateBtn.classList.add('loading');
                generateBtn.disabled = true;

                const candidates = await generateStoryCandidates(genre, storyCharacters, prompt, currentStory);
                showCandidatesModal(candidates);

            } catch (error) {
                console.error('Story generation failed:', error);
                showMessage(error.message, 'error');
            } finally {
                generateBtn.classList.remove('loading');
                generateBtn.disabled = false;
            }
        });
    }
}

function showCandidatesModal(candidates) {
    const modal = document.getElementById('candidates-modal');
    const container = document.getElementById('candidates-container');
    const closeBtn = document.getElementById('close-candidates');

    if (!modal || !container) return;

    container.innerHTML = candidates.map((candidate, index) => `
        <div class="candidate-card" data-index="${index}">
            <div class="candidate-text">${candidate}</div>
        </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.candidate-card').forEach(card => {
        card.addEventListener('click', () => {
            const index = parseInt(card.getAttribute('data-index'));
            selectCandidate(candidates[index]);
            modal.classList.remove('active');
        });
    });

    modal.classList.add('active');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
}

function selectCandidate(candidateText) {
    currentStory += (currentStory ? '\n\n' : '') + candidateText;
    displayStory();
    showMessage('Story updated successfully!', 'success');
}

function displayStory() {
    const storyContent = document.getElementById('story-content');
    if (storyContent) {
        if (currentStory) {
            storyContent.innerHTML = `<p>${currentStory.replace(/\n/g, '</p><p>')}</p>`;
        } else {
            storyContent.innerHTML = '<p class="story-placeholder">Your generated story will appear here...</p>';
        }
    }
}

function setupStorySaveControls() {
    const saveBtn = document.getElementById('save-story');
    const exportBtn = document.getElementById('export-story');
    const clearBtn = document.getElementById('clear-story');

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!currentStory.trim()) {
                showMessage('No story content to save.', 'error');
                return;
            }

            if (!currentUser) {
                showMessage('Please log in to save stories.', 'error');
                return;
            }

            try {
                const storyData = {
                    title: `${document.getElementById('genre-select')?.value || 'Story'} - ${new Date().toLocaleDateString()}`,
                    content: currentStory,
                    genre: document.getElementById('genre-select')?.value,
                    characters: storyCharacters,
                    prompt: document.getElementById('story-prompt')?.value
                };

                const result = await saveStory(currentUser.uid, storyData);
                if (result.success) {
                    currentSessionId = result.id;
                    showMessage('Story saved successfully!', 'success');
                } else {
                    showMessage('Failed to save story: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('Save error:', error);
                showMessage('Error saving story.', 'error');
            }
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!currentStory.trim()) {
                showMessage('No story content to export.', 'error');
                return;
            }

            // Show export options
            showExportOptions();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the current story? This action cannot be undone.')) {
                currentStory = '';
                displayStory();
                showMessage('Story cleared.', 'success');
            }
        });
    }
}

// Gaming page initialization
function initializeGamingPage() {
    setupNavigation();
    setupGameCharacterManager();
    setupGameGenerator();
    setupGameSaveControls();
    setupLogout();
    
    // Check if we need to load a specific game
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    if (gameId) {
        loadSavedGame(gameId);
    }
}

function setupGameCharacterManager() {
    const addCharacterBtn = document.getElementById('add-game-character');
    const characterInput = document.getElementById('game-character-input');
    const characterList = document.getElementById('game-character-list');

    if (addCharacterBtn && characterInput) {
        addCharacterBtn.addEventListener('click', () => {
            const name = characterInput.value.trim();
            if (name && !gameCharacters.includes(name)) {
                gameCharacters.push(name);
                updateGameCharacterList();
                characterInput.value = '';
            }
        });

        characterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addCharacterBtn.click();
            }
        });
    }

    function updateGameCharacterList() {
        if (!characterList) return;
        
        characterList.innerHTML = gameCharacters.map(character => `
            <div class="character-item">
                <span class="character-name">${character}</span>
                <button class="remove-character" data-character="${character}">×</button>
            </div>
        `).join('');

        // Add remove handlers
        characterList.querySelectorAll('.remove-character').forEach(btn => {
            btn.addEventListener('click', () => {
                const character = btn.getAttribute('data-character');
                gameCharacters = gameCharacters.filter(c => c !== character);
                updateGameCharacterList();
            });
        });
    }
}

function setupGameGenerator() {
    const generateBtn = document.getElementById('generate-game');
    
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const gameType = document.getElementById('game-type-select')?.value || 'action';
            const platform = document.getElementById('platform-select')?.value || 'pc';
            const mechanics = document.getElementById('mechanics-input')?.value.trim() || 'basic gameplay';

            try {
                generateBtn.classList.add('loading');
                generateBtn.disabled = true;

                const gameContent = await generateGameConcept(gameType, platform, mechanics, gameCharacters);
                currentGame = gameContent;
                displayGame();
                showMessage('Game concept generated successfully!', 'success');

            } catch (error) {
                console.error('Game generation failed:', error);
                showMessage(error.message, 'error');
            } finally {
                generateBtn.classList.remove('loading');
                generateBtn.disabled = false;
            }
        });
    }
}

function displayGame() {
    const gameContent = document.getElementById('game-content');
    if (gameContent) {
        if (currentGame) {
            gameContent.innerHTML = `<div class="game-concept">${currentGame.replace(/\n/g, '<br>')}</div>`;
        } else {
            gameContent.innerHTML = '<p class="story-placeholder">Your game concept will appear here...</p>';
        }
    }
}

function setupGameSaveControls() {
    const saveBtn = document.getElementById('save-game');
    const exportBtn = document.getElementById('export-game');
    const clearBtn = document.getElementById('clear-game');

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!currentGame.trim()) {
                showMessage('No game concept to save.', 'error');
                return;
            }

            if (!currentUser) {
                showMessage('Please log in to save game concepts.', 'error');
                return;
            }

            try {
                const gameData = {
                    title: `${document.getElementById('game-type-select')?.value || 'Game'} - ${new Date().toLocaleDateString()}`,
                    content: currentGame,
                    gameType: document.getElementById('game-type-select')?.value,
                    platform: document.getElementById('platform-select')?.value,
                    mechanics: document.getElementById('mechanics-input')?.value,
                    characters: gameCharacters
                };

                const result = await saveGame(currentUser.uid, gameData);
                if (result.success) {
                    showMessage('Game concept saved successfully!', 'success');
                } else {
                    showMessage('Failed to save game concept: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('Save error:', error);
                showMessage('Error saving game concept.', 'error');
            }
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!currentGame.trim()) {
                showMessage('No game concept to export.', 'error');
                return;
            }

            const blob = new Blob([currentGame], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `game-concept-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showMessage('Game concept exported successfully!', 'success');
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the current game concept?')) {
                currentGame = '';
                displayGame();
                showMessage('Game concept cleared.', 'success');
            }
        });
    }
}

// Education page initialization
function initializeEducationPage() {
    setupNavigation();
    setupEducationNavigation();
    setupEducationChats();
    setupLogout();
    
    // Check if we need to load a specific chat
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chat');
    if (chatId) {
        loadSavedChat(chatId);
    }
}

function setupEducationNavigation() {
    // Level selection
    const levelCards = document.querySelectorAll('.education-card');
    
    levelCards.forEach(card => {
        card.addEventListener('click', () => {
            const level = card.getAttribute('data-level');
            showEducationLevel(level);
        });
    });

    // Back buttons
    const backButtons = document.querySelectorAll('.level-back-btn, .chat-back-btn, .branch-back-btn');
    
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            showLevelSelection();
        });
    });

    // Intermediate chat button
    const openChatBtn = document.getElementById('open-intermediate-chat');
    if (openChatBtn) {
        openChatBtn.addEventListener('click', () => {
            showIntermediateChat();
        });
    }

    // College branch cards
    const branchCards = document.querySelectorAll('.branch-card');
    
    branchCards.forEach(card => {
        card.addEventListener('click', () => {
            const branch = card.getAttribute('data-branch');
            if (branch === 'cse') {
                showCSEResources();
            } else {
                showMessage('Resources for this branch are coming soon!', 'info');
            }
        });
    });
}

function showEducationLevel(level) {
    hideAllEducationSections();
    
    if (level === 'school') {
        const schoolChat = document.getElementById('school-chat');
        if (schoolChat) {
            schoolChat.classList.add('active');
        }
    } else if (level === 'intermediate') {
        const intermediateSection = document.getElementById('intermediate-section');
        if (intermediateSection) {
            intermediateSection.classList.add('active');
        }
    } else if (level === 'college') {
        const collegeSection = document.getElementById('college-section');
        if (collegeSection) {
            collegeSection.classList.add('active');
        }
    }
}

function showIntermediateChat() {
    hideAllEducationSections();
    const intermediateChat = document.getElementById('intermediate-chat');
    if (intermediateChat) {
        intermediateChat.classList.add('active');
    }
}

function showCSEResources() {
    hideAllEducationSections();
    const cseResources = document.getElementById('cse-resources');
    if (cseResources) {
        cseResources.classList.add('active');
    }
}

function showLevelSelection() {
    hideAllEducationSections();
    const levelSelection = document.getElementById('level-selection');
    if (levelSelection) {
        levelSelection.classList.add('active');
    }
}

function hideAllEducationSections() {
    const sections = [
        'level-selection', 'school-chat', 'intermediate-section', 
        'intermediate-chat', 'college-section', 'cse-resources'
    ];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('active');
        }
    });
}

function setupEducationChats() {
    // School chat
    setupChatInterface('school-chat-input', 'school-send-btn', 'school-chat-messages', 'school');
    
    // Intermediate chat
    setupChatInterface('intermediate-chat-input', 'intermediate-send-btn', 'intermediate-chat-messages', 'intermediate');
}

function setupChatInterface(inputId, sendBtnId, messagesId, level) {
    const input = document.getElementById(inputId);
    const sendBtn = document.getElementById(sendBtnId);
    const messages = document.getElementById(messagesId);

    if (input && sendBtn && messages) {
        const sendMessage = async () => {
            const question = input.value.trim();
            if (!question) return;

            // Add user message
            addChatMessage(messages, question, 'user');
            input.value = '';

            try {
                // Show typing indicator
                const typingIndicator = addChatMessage(messages, 'AI is thinking...', 'ai', true);
                
                const response = await getEducationalResponse(question, level);
                
                // Remove typing indicator
                typingIndicator.remove();
                
                // Add AI response
                addChatMessage(messages, response, 'ai');

                // Save chat to database
                if (currentUser) {
                    await saveChat(currentUser.uid, {
                        level,
                        question,
                        response,
                        timestamp: new Date().toISOString()
                    });
                }

            } catch (error) {
                console.error('Chat error:', error);
                addChatMessage(messages, 'Sorry, I encountered an error. Please try again.', 'ai');
                showMessage(error.message, 'error');
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function addChatMessage(container, content, type, isTyping = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message${isTyping ? ' loading' : ''}`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${content}</p>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    
    return messageDiv;
}

// Story Editor AI functionality
function setupStoryEditorAI() {
    const storyChatInput = document.getElementById('story-chat-input');
    const storyChatSend = document.getElementById('story-chat-send');
    const storyChatMessages = document.getElementById('story-chat-messages');
    const storyContent = document.getElementById('story-content');

    if (!storyChatInput || !storyChatSend || !storyChatMessages) return;

    async function sendStoryEditMessage() {
        const message = storyChatInput.value.trim();
        if (!message) return;

        // Add user message
        addStoryChatMessage(message, 'user');
        storyChatInput.value = '';

        // Show typing indicator
        const typingIndicator = addStoryChatMessage('Thinking...', 'ai', true);

        try {
            // Get current story content
            const currentStoryText = storyContent.textContent || '';
            
            // Generate AI response for story editing
            const aiResponse = await generateStoryEditResponse(message, currentStoryText);
            
            // Remove typing indicator and add AI response
            if (typingIndicator) {
                typingIndicator.remove();
            }
            
            addStoryChatMessage(aiResponse, 'ai');

            // If the AI response contains story modifications, update the story
            if (aiResponse.includes('STORY_UPDATE:')) {
                const storyUpdate = aiResponse.split('STORY_UPDATE:')[1].trim();
                updateStoryContent(storyUpdate);
            }

        } catch (error) {
            console.error('Story edit failed:', error);
            if (typingIndicator) {
                typingIndicator.remove();
            }
            addStoryChatMessage('Sorry, I encountered an error while processing your request. Please try again.', 'ai');
        }
    }

    function addStoryChatMessage(content, type, isTyping = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message${isTyping ? ' loading' : ''}`;
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;
        
        storyChatMessages.appendChild(messageDiv);
        storyChatMessages.scrollTop = storyChatMessages.scrollHeight;
        
        return messageDiv;
    }

    function updateStoryContent(newContent) {
        if (storyContent) {
            storyContent.innerHTML = `<p>${newContent}</p>`;
            currentStory = newContent;
            showMessage('Story updated successfully!', 'success');
        }
    }

    // Event listeners
    storyChatSend.addEventListener('click', sendStoryEditMessage);
    storyChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendStoryEditMessage();
        }
    });
}

async function generateStoryEditResponse(userMessage, currentStory) {
    try {
        const prompt = `You are a helpful story editor AI. The user wants to modify their story. 
        
Current story: "${currentStory}"

User request: "${userMessage}"

Please help them modify the story. If they want to change the story content, respond with "STORY_UPDATE:" followed by the modified story. 
If they're asking for suggestions or advice, provide helpful feedback without changing the story.

Be creative and helpful in your response.`;

        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                maxTokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        return data.response || 'I understand you want to modify your story. Could you please be more specific about what changes you\'d like to make?';

    } catch (error) {
        console.error('Error generating story edit response:', error);
        // Fallback response
        return `I can help you modify your story! Here are some things you can ask me to do:
        
• Change the ending
• Add more characters
• Make it more exciting
• Change the setting
• Add dialogue
• Make it longer or shorter

What specific changes would you like to make to your story?`;
    }
}

// Text-to-Speech functionality
let speechSynthesis = null;
let currentUtterance = null;
let selectedVoice = null;

function setupTextToSpeech() {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
        speechSynthesis = window.speechSynthesis;
        
        // Wait for voices to load
        speechSynthesis.onvoiceschanged = () => {
            selectFemaleVoice();
        };
        
        // Select female voice immediately if available
        selectFemaleVoice();
    }

    const speakBtn = document.getElementById('speak-story');
    if (speakBtn) {
        speakBtn.addEventListener('click', toggleSpeech);
    }
}

function selectFemaleVoice() {
    if (!speechSynthesis) return;
    
    const voices = speechSynthesis.getVoices();
    
    // Try to find a female voice (preferably Siri-like)
    selectedVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('siri') ||
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('girl') ||
        (voice.name.toLowerCase().includes('karen') && voice.lang.includes('en')) ||
        (voice.name.toLowerCase().includes('samantha') && voice.lang.includes('en'))
    );
    
    // Fallback to any English female voice
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.toLowerCase().includes('female') || 
             voice.name.toLowerCase().includes('woman') ||
             voice.name.toLowerCase().includes('girl'))
        );
    }
    
    // Final fallback to any English voice
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
    }
    
    console.log('Selected voice:', selectedVoice?.name || 'Default voice');
}

function toggleSpeech() {
    const speakBtn = document.getElementById('speak-story');
    const storyContent = document.getElementById('story-content');
    
    if (!speakBtn || !storyContent) return;
    
    if (speechSynthesis.speaking) {
        // Stop speaking
        speechSynthesis.cancel();
        speakBtn.classList.remove('speaking');
        speakBtn.innerHTML = '<span class="speak-icon">🔊</span><span class="speak-text">Read Story</span>';
        showMessage('Speech stopped', 'info');
    } else {
        // Start speaking
        const storyText = storyContent.textContent || storyContent.innerText;
        
        if (!storyText || storyText === 'Your generated story will appear here...') {
            showMessage('No story to read. Please generate a story first.', 'error');
            return;
        }
        
        speakStory(storyText);
        speakBtn.classList.add('speaking');
        speakBtn.innerHTML = '<span class="speak-icon">⏹️</span><span class="speak-text">Stop Reading</span>';
        showMessage('Reading story aloud...', 'success');
    }
}

function speakStory(text) {
    if (!speechSynthesis || !selectedVoice) {
        showMessage('Speech synthesis not available', 'error');
        return;
    }
    
    // Cancel any existing speech
    speechSynthesis.cancel();
    
    // Create new utterance
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.voice = selectedVoice;
    currentUtterance.rate = 0.9; // Slightly slower for better clarity
    currentUtterance.pitch = 1.1; // Slightly higher pitch for female voice
    currentUtterance.volume = 1.0;
    
    // Handle speech events
    currentUtterance.onend = () => {
        const speakBtn = document.getElementById('speak-story');
        if (speakBtn) {
            speakBtn.classList.remove('speaking');
            speakBtn.innerHTML = '<span class="speak-icon">🔊</span><span class="speak-text">Read Story</span>';
        }
        showMessage('Finished reading story', 'success');
    };
    
    currentUtterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        const speakBtn = document.getElementById('speak-story');
        if (speakBtn) {
            speakBtn.classList.remove('speaking');
            speakBtn.innerHTML = '<span class="speak-icon">🔊</span><span class="speak-text">Read Story</span>';
        }
        showMessage('Error reading story', 'error');
    };
    
    // Start speaking
    speechSynthesis.speak(currentUtterance);
}

// Story sharing and export functionality
function showExportOptions() {
    const exportModal = document.createElement('div');
    exportModal.className = 'modal';
    exportModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Export & Share Story</h3>
                <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="export-options">
                    <button class="export-option" onclick="window.app.exportAsText()">
                        <span class="export-icon">📄</span>
                        <span>Download as Text</span>
                    </button>
                    <button class="export-option" onclick="window.app.exportAsHTML()">
                        <span class="export-icon">🌐</span>
                        <span>Download as HTML</span>
                    </button>
                    <button class="export-option" onclick="window.app.shareStory()">
                        <span class="export-icon">🔗</span>
                        <span>Create Shareable Link</span>
                    </button>
                    <button class="export-option" onclick="window.app.copyToClipboard()">
                        <span class="export-icon">📋</span>
                        <span>Copy to Clipboard</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(exportModal);
}

function exportAsText() {
    const blob = new Blob([currentStory], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('Story exported as text file!', 'success');
    document.querySelector('.modal').remove();
}

function exportAsHTML() {
    const storyTitle = document.getElementById('genre-select')?.value || 'Story';
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${storyTitle}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 40px; background: #f5f5f5; }
        .story-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .story-title { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 30px; }
        .story-content { font-size: 18px; color: #444; }
        .story-meta { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="story-container">
        <h1 class="story-title">${storyTitle}</h1>
        <div class="story-content">${currentStory.replace(/\n/g, '</p><p>')}</div>
        <div class="story-meta">
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Genre: ${document.getElementById('genre-select')?.value || 'Unknown'}</p>
        </div>
    </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('Story exported as HTML file!', 'success');
    document.querySelector('.modal').remove();
}

async function shareStory() {
    if (!currentUser) {
        showMessage('Please log in to share stories.', 'error');
        return;
    }

    try {
        // Create a unique story ID
        const storyId = generateStoryId();
        
        // Save story to public stories collection
        const publicStoryData = {
            title: `${document.getElementById('genre-select')?.value || 'Story'} - ${new Date().toLocaleDateString()}`,
            content: currentStory,
            genre: document.getElementById('genre-select')?.value,
            characters: storyCharacters,
            prompt: document.getElementById('story-prompt')?.value,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || currentUser.email,
            isPublic: true,
            shareId: storyId
        };

        const result = await savePublicStory(storyId, publicStoryData);
        if (result.success) {
            const shareUrl = `${window.location.origin}/view-story.html?id=${storyId}`;
            
            // Show share URL
            showShareUrl(shareUrl);
            showMessage('Story shared successfully!', 'success');
        } else {
            showMessage('Failed to share story: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Share error:', error);
        showMessage('Error sharing story.', 'error');
    }
}

function showShareUrl(shareUrl) {
    const shareModal = document.createElement('div');
    shareModal.className = 'modal';
    shareModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Share Your Story</h3>
                <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <p>Your story is now publicly accessible! Share this link with others:</p>
                <div class="share-url-container">
                    <input type="text" id="share-url" value="${shareUrl}" readonly class="share-url-input">
                    <button onclick="window.app.copyShareUrl()" class="copy-btn">Copy</button>
                </div>
                <div class="share-actions">
                    <button onclick="window.open('${shareUrl}', '_blank')" class="preview-btn">Preview Story</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(shareModal);
}

function copyShareUrl() {
    const urlInput = document.getElementById('share-url');
    urlInput.select();
    document.execCommand('copy');
    showMessage('Share URL copied to clipboard!', 'success');
}

async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(currentStory);
        showMessage('Story copied to clipboard!', 'success');
        document.querySelector('.modal').remove();
    } catch (error) {
        showMessage('Failed to copy to clipboard', 'error');
    }
}

function generateStoryId() {
    return 'story_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Common navigation setup
function setupNavigation() {
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const result = await logout();
            if (result.success) {
                window.location.href = 'index.html';
            } else {
                showMessage('Error logging out.', 'error');
            }
        });
    }
}

async function updateUserDisplay(user) {
    const userNameElements = document.querySelectorAll('#user-name');
    
    if (userNameElements.length > 0) {
        try {
            const result = await getUserData(user.uid);
            const displayName = result.success ? result.data.name : user.email;
            
            userNameElements.forEach(element => {
                element.textContent = displayName;
            });
        } catch (error) {
            console.error('Error getting user data:', error);
            userNameElements.forEach(element => {
                element.textContent = user.email;
            });
        }
    }
}

// Utility functions
function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `${type}-message`;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 300);
    }, 3000);
}

// Export for global access
window.app = {
    currentUser,
    currentStory,
    currentGame,
    showMessage,
    updateUserDisplay,
    openStory,
    openGame,
    openEducation,
    openRecentItem,
    exportAsText,
    exportAsHTML,
    shareStory,
    copyToClipboard,
    copyShareUrl
};