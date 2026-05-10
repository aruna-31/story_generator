import { getPublicStory } from './firebase.js';

// Global variables
let currentStory = null;
let speechSynthesis = null;
let selectedVoice = null;
let currentUtterance = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    await initializeStoryViewer();
});

async function initializeStoryViewer() {
    // Get story ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('id');
    
    if (!storyId) {
        showError('No story ID provided');
        return;
    }
    
    try {
        // Load the story
        const result = await getPublicStory(storyId);
        
        if (result.success) {
            currentStory = result.data;
            displayStory();
            initializeSpeechSynthesis();
            setupEventListeners();
        } else {
            showError(result.error || 'Story not found');
        }
    } catch (error) {
        console.error('Error loading story:', error);
        showError('Failed to load story');
    }
}

function displayStory() {
    const loading = document.getElementById('loading');
    const storyContainer = document.getElementById('story-container');
    const error = document.getElementById('error');
    
    // Hide loading and error, show story
    loading.style.display = 'none';
    error.style.display = 'none';
    storyContainer.style.display = 'block';
    
    // Update story content
    document.getElementById('story-title').textContent = currentStory.title || 'Untitled Story';
    document.getElementById('story-genre').textContent = currentStory.genre || 'Unknown Genre';
    document.getElementById('story-author').textContent = currentStory.authorName || 'Anonymous';
    document.getElementById('story-date').textContent = formatDate(currentStory.createdAt);
    
    // Format and display story content
    const storyContent = document.getElementById('story-content');
    if (currentStory.content) {
        const paragraphs = currentStory.content.split('\n').filter(p => p.trim());
        storyContent.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
    } else {
        storyContent.innerHTML = '<p>No content available.</p>';
    }
    
    // Update page title
    document.title = `${currentStory.title} - AI Story Teller`;
}

function showError(message) {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const storyContainer = document.getElementById('story-container');
    
    loading.style.display = 'none';
    storyContainer.style.display = 'none';
    error.style.display = 'block';
    
    const errorMessage = document.querySelector('.error p');
    if (errorMessage) {
        errorMessage.textContent = message;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown Date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return 'Unknown Date';
    }
}

function initializeSpeechSynthesis() {
    if ('speechSynthesis' in window) {
        speechSynthesis = window.speechSynthesis;
        
        // Wait for voices to load
        if (speechSynthesis.getVoices().length > 0) {
            selectFemaleVoice();
        } else {
            speechSynthesis.onvoiceschanged = () => {
                selectFemaleVoice();
            };
        }
    }
}

function selectFemaleVoice() {
    if (!speechSynthesis) return;
    
    const voices = speechSynthesis.getVoices();
    
    // Try to find a female voice
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
}

function setupEventListeners() {
    const speakBtn = document.getElementById('speak-btn');
    const copyBtn = document.getElementById('copy-btn');
    
    if (speakBtn) {
        speakBtn.addEventListener('click', toggleSpeech);
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', copyStoryToClipboard);
    }
}

function toggleSpeech() {
    const speakBtn = document.getElementById('speak-btn');
    
    if (!speakBtn) return;
    
    if (speechSynthesis && speechSynthesis.speaking) {
        // Stop speaking
        speechSynthesis.cancel();
        speakBtn.innerHTML = '<span>🔊</span><span>Read Aloud</span>';
        showMessage('Speech stopped', 'info');
    } else {
        // Start speaking
        if (!currentStory || !currentStory.content) {
            showMessage('No story content to read', 'error');
            return;
        }
        
        speakStory(currentStory.content);
        speakBtn.innerHTML = '<span>⏹️</span><span>Stop Reading</span>';
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
    currentUtterance.rate = 0.9;
    currentUtterance.pitch = 1.1;
    currentUtterance.volume = 1.0;
    
    // Handle speech events
    currentUtterance.onend = () => {
        const speakBtn = document.getElementById('speak-btn');
        if (speakBtn) {
            speakBtn.innerHTML = '<span>🔊</span><span>Read Aloud</span>';
        }
        showMessage('Finished reading story', 'success');
    };
    
    currentUtterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        const speakBtn = document.getElementById('speak-btn');
        if (speakBtn) {
            speakBtn.innerHTML = '<span>🔊</span><span>Read Aloud</span>';
        }
        showMessage('Error reading story', 'error');
    };
    
    speechSynthesis.speak(currentUtterance);
}

async function copyStoryToClipboard() {
    if (!currentStory || !currentStory.content) {
        showMessage('No story content to copy', 'error');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(currentStory.content);
        showMessage('Story copied to clipboard!', 'success');
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentStory.content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('Story copied to clipboard!', 'success');
    }
}

function showMessage(message, type = 'info') {
    // Create a simple message display
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    // Set background color based on message type
    switch (type) {
        case 'success':
            messageDiv.style.background = '#28a745';
            break;
        case 'error':
            messageDiv.style.background = '#dc3545';
            break;
        case 'warning':
            messageDiv.style.background = '#ffc107';
            messageDiv.style.color = '#333';
            break;
        default:
            messageDiv.style.background = '#17a2b8';
    }
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
