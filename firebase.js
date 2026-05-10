// Firebase configuration and helpers
// WARNING: Embedding API keys in client code is insecure for production.
// Consider using environment variables and server-side authentication.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getDatabase, 
    ref, 
    set, 
    push, 
    get, 
    child 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBGjU0lp1WMJF6d3EEWOd7SSbgw5o_2B3s",
    authDomain: "ai-story-21f04.firebaseapp.com",
    databaseURL: "https://ai-story-21f04-default-rtdb.firebaseio.com/",
    projectId: "ai-story-21f04",
    storageBucket: "ai-story-21f04.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Export for global access
window.firebase = {
    auth,
    database,
    ref,
    set,
    push,
    get,
    child
};

// Authentication helpers
export async function signUp(email, password, name) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save user profile to database
        await set(ref(database, `users/${user.uid}`), {
            name: name,
            email: email,
            createdAt: new Date().toISOString()
        });
        
        console.log('User created successfully:', user.uid);
        return { success: true, user };
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: getFirebaseErrorMessage(error.code) };
    }
}

export async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in successfully:', userCredential.user.uid);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Signin error:', error);
        return { success: false, error: getFirebaseErrorMessage(error.code) };
    }
}

export async function logout() {
    try {
        await signOut(auth);
        console.log('User signed out successfully');
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// Database helpers
export async function saveStory(userId, storyData) {
    try {
        const storiesRef = ref(database, `stories/${userId}`);
        const newStoryRef = push(storiesRef);
        await set(newStoryRef, {
            ...storyData,
            createdAt: new Date().toISOString(),
            type: 'story'
        });
        console.log('Story saved successfully');
        return { success: true, id: newStoryRef.key };
    } catch (error) {
        console.error('Save story error:', error);
        return { success: false, error: error.message };
    }
}

export async function saveGame(userId, gameData) {
    try {
        const gamesRef = ref(database, `games/${userId}`);
        const newGameRef = push(gamesRef);
        await set(newGameRef, {
            ...gameData,
            createdAt: new Date().toISOString(),
            type: 'game'
        });
        console.log('Game concept saved successfully');
        return { success: true, id: newGameRef.key };
    } catch (error) {
        console.error('Save game error:', error);
        return { success: false, error: error.message };
    }
}

export async function saveChat(userId, chatData) {
    try {
        const chatsRef = ref(database, `chats/${userId}`);
        const newChatRef = push(chatsRef);
        await set(newChatRef, {
            ...chatData,
            createdAt: new Date().toISOString(),
            type: 'chat'
        });
        console.log('Chat saved successfully');
        return { success: true, id: newChatRef.key };
    } catch (error) {
        console.error('Save chat error:', error);
        return { success: false, error: error.message };
    }
}

export async function savePublicStory(storyId, storyData) {
    try {
        const publicStoriesRef = ref(database, `publicStories/${storyId}`);
        await set(publicStoriesRef, {
            ...storyData,
            createdAt: new Date().toISOString(),
            type: 'publicStory'
        });
        console.log('Public story saved successfully');
        return { success: true, id: storyId };
    } catch (error) {
        console.error('Save public story error:', error);
        return { success: false, error: error.message };
    }
}

export async function getPublicStory(storyId) {
    try {
        const snapshot = await get(child(ref(database), `publicStories/${storyId}`));
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        } else {
            return { success: false, error: 'Story not found' };
        }
    } catch (error) {
        console.error('Get public story error:', error);
        return { success: false, error: error.message };
    }
}

export async function getStoryById(userId, storyId) {
    try {
        const snapshot = await get(child(ref(database), `stories/${userId}/${storyId}`));
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        } else {
            return { success: false, error: 'Story not found' };
        }
    } catch (error) {
        console.error('Get story by ID error:', error);
        return { success: false, error: error.message };
    }
}

export async function getGameById(userId, gameId) {
    try {
        const snapshot = await get(child(ref(database), `games/${userId}/${gameId}`));
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        } else {
            return { success: false, error: 'Game not found' };
        }
    } catch (error) {
        console.error('Get game by ID error:', error);
        return { success: false, error: error.message };
    }
}

export async function getChatById(userId, chatId) {
    try {
        const snapshot = await get(child(ref(database), `chats/${userId}/${chatId}`));
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        } else {
            return { success: false, error: 'Chat not found' };
        }
    } catch (error) {
        console.error('Get chat by ID error:', error);
        return { success: false, error: error.message };
    }
}

export async function getUserData(userId) {
    try {
        const snapshot = await get(child(ref(database), `users/${userId}`));
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        } else {
            return { success: false, error: 'User data not found' };
        }
    } catch (error) {
        console.error('Get user data error:', error);
        return { success: false, error: error.message };
    }
}

export async function getUserHistory(userId) {
    try {
        const promises = [
            get(child(ref(database), `stories/${userId}`)),
            get(child(ref(database), `games/${userId}`)),
            get(child(ref(database), `chats/${userId}`))
        ];
        
        const [storiesSnapshot, gamesSnapshot, chatsSnapshot] = await Promise.all(promises);
        
        const history = [];
        
        if (storiesSnapshot.exists()) {
            Object.entries(storiesSnapshot.val()).forEach(([id, data]) => {
                history.push({ id, ...data });
            });
        }
        
        if (gamesSnapshot.exists()) {
            Object.entries(gamesSnapshot.val()).forEach(([id, data]) => {
                history.push({ id, ...data });
            });
        }
        
        if (chatsSnapshot.exists()) {
            Object.entries(chatsSnapshot.val()).forEach(([id, data]) => {
                history.push({ id, ...data });
            });
        }
        
        // Sort by creation date (newest first)
        history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return { success: true, data: history };
    } catch (error) {
        console.error('Get history error:', error);
        return { success: false, error: error.message };
    }
}

// Auth state observer
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

// Helper function to convert Firebase error codes to user-friendly messages
function getFirebaseErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered. Please use a different email or sign in.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password should be at least 6 characters long.',
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.'
    };
    
    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
}