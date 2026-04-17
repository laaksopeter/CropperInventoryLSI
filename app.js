import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAcxV21wY94f-t7v1SiboA-LqajhrdA2qQ",
  authDomain: "cropperiventorylsi.firebaseapp.com",
  projectId: "cropperiventorylsi",
  storageBucket: "cropperiventorylsi.firebasestorage.app",
  messagingSenderId: "998856931247",
  appId: "1:998856931247:web:30e00bea814a4fd731615a",
  measurementId: "G-PJB6W71DX7"
};

// PASTE YOUR ACTUAL GOOGLE WEB APP URL HERE (Ends in /exec)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxCN5wNS4lslN4CgL1FUy22_0SJB7yQsGAh12DzhJydYFC2kC9pA6cEgSFXn8SmoZdm/exec";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById('login-btn');
const inventoryUI = document.getElementById('inventory-ui');
const authContainer = document.getElementById('auth-container');
const form = document.getElementById('material-form');
const userGreeting = document.getElementById('user-greeting');
const submitBtn = document.getElementById('submit-btn');

loginBtn.onclick = () => signInWithPopup(auth, provider);

onAuthStateChanged(auth, (user) => {
    if (user) {
        authContainer.style.display = 'none';
        inventoryUI.style.display = 'block';
        userGreeting.innerText = `Worker: ${user.displayName}`;
    } else {
        authContainer.style.display = 'block';
        inventoryUI.style.display = 'none';
    }
});

form.onsubmit = async (e) => {
    e.preventDefault();
    
    // UI Feedback
    submitBtn.innerText = "Syncing...";
    submitBtn.disabled = true;

    // Generate Randomized Tracking ID
    const randomId = "SH-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const data = {
        item: document.getElementById('mat-name').value,
        cert: document.getElementById('cert-num').value,
        size: document.getElementById('sheet-size').value,
        qty: document.getElementById('mat-qty').value,
        id: randomId,
        user: auth.currentUser.email
    };

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            body: JSON.stringify(data)
        });

        alert(`Success! Logged ID: ${randomId}`);
        form.reset();
    } catch (err) {
        console.error("Sync Error:", err);
        alert("Failed to connect to Sheet.");
    } finally {
        submitBtn.innerText = "Log Sheet Entry";
        submitBtn.disabled = false;
    }
};