import { 
  initializeFirebase, 
  onAuthStateChangedHandler, 
  fsSignOut, 
  fsAddFriend 
} from './app-firebase.js';

// Initialize Firebase
initializeFirebase();

// Attach Firebase auth state change handler
onAuthStateChangedHandler();

// Expose sign-out and add-friend functions globally
window.fsSignOut = fsSignOut;
window.fsAddFriend = fsAddFriend;
