import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAcxV21wY94f-t7v1SiboA-LqajhrdA2qQ",
  authDomain: "cropperiventorylsi.firebaseapp.com",
  projectId: "cropperiventorylsi",
  storageBucket: "cropperiventorylsi.firebasestorage.app",
  messagingSenderId: "998856931247",
  appId: "1:998856931247:web:30e00bea814a4fd731615a"
};

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxCN5wNS4lslN4CgL1FUy22_0SJB7yQsGAh12DzhJydYFC2kC9pA6cEgSFXn8SmoZdm/exec";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// DOM Elements
const matSelect = document.getElementById('mat-name'); 
const structTypeSelect = document.getElementById('struct-type');
const modeSheet = document.getElementById('mode-sheet');
const modeTube = document.getElementById('mode-tube');
const inventoryList = document.getElementById('inventory-list');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

let currentMode = 'Sheet';
let currentStock = [];

// Data Definitions
const sheetGrades = ["A1008", "A1011", "A36", "5052", "5052 Filmed", "6061", "304 #4", "304 2B", "316", "Other"];
const tubeShapes = ["Square", "Rectangle", "Round", "Angle", "Channel", "Bar"];
const tubeMaterials = ["6061", "A513", "A500", "DOM", "4130", "Stainless", "Other"];

// Mode Switching Logic
function setMode(mode) {
    currentMode = mode;
    inventoryList.innerHTML = "<p class='footer-note'>Select a category above.</p>";
    currentStock = [];

    if (mode === 'Sheet') {
        modeSheet.classList.add('active'); modeTube.classList.remove('active');
        document.getElementById('group-type').style.display = 'none';
        document.getElementById('label-grade').innerText = "Material Grade";
        document.getElementById('label-dim').innerText = "Thickness";
        document.getElementById('label-len').innerText = "Size (W x L)";
        document.getElementById('search-3').placeholder = "Filt. Logged By";
        updateSelect(matSelect, sheetGrades);
    } else {
        modeSheet.classList.remove('active'); modeTube.classList.add('active');
        document.getElementById('group-type').style.display = 'block';
        document.getElementById('label-grade').innerText = "Structural Shape";
        document.getElementById('label-dim').innerText = "Dimensions (OD x Wall)";
        document.getElementById('label-len').innerText = "Length (Remnant)";
        document.getElementById('search-3').placeholder = "Filt. Material";
        updateSelect(matSelect, tubeShapes);
        updateSelect(structTypeSelect, tubeMaterials);
    }
}

function updateSelect(element, options) {
    element.innerHTML = '<option value="" disabled selected>Select...</option>';
    options.forEach(opt => {
        let el = document.createElement('option');
        el.value = opt; el.textContent = opt;
        element.appendChild(el);
    });
}

modeSheet.onclick = () => setMode('Sheet');
modeTube.onclick = () => setMode('Structural');
setMode('Sheet'); 

// Auth Handlers
loginBtn.onclick = () => signInWithPopup(auth, provider);
logoutBtn.onclick = () => signOut(auth);
onAuthStateChanged(auth, (user) => {
    document.getElementById('auth-container').style.display = user ? 'none' : 'block';
    document.getElementById('inventory-ui').style.display = user ? 'flex' : 'none';
    if(user) document.getElementById('user-greeting').innerText = `Worker: ${user.displayName}`;
});

// Data Handlers
async function loadInventory(category) {
    inventoryList.innerHTML = "<p class='footer-note'>Accessing database...</p>";
    try {
        const response = await fetch(`${SCRIPT_URL}?grade=${category}`);
        currentStock = await response.json();
        renderInventory(currentStock);
    } catch (err) { inventoryList.innerHTML = "<p class='footer-note'>Database Error.</p>"; }
}

function renderInventory(items) {
    inventoryList.innerHTML = "";
    const s1 = document.getElementById('search-1').value.toLowerCase();
    const s2 = document.getElementById('search-2').value.toLowerCase();
    const s3 = document.getElementById('search-3').value.toLowerCase();

    const filtered = items.filter(i => 
        i.thickness.toLowerCase().includes(s1) && 
        i.size.toLowerCase().includes(s2) &&
        (currentMode === 'Sheet' ? i.user.toLowerCase().includes(s3) : (i.other_type || "").toLowerCase().includes(s3))
    );

    if (filtered.length === 0) { inventoryList.innerHTML = "<p class='footer-note'>Empty.</p>"; return; }

    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = "stock-item";
        div.innerHTML = `
            <div>
                <strong>${item.thickness} | ${item.size}</strong><br>
                <small>${currentMode === 'Structural' ? 'Material: <b>' + item.other_type + '</b> | ' : ''}Cert: ${item.cert} | Loc: ${item.loc}</small><br>
                <small style="color:var(--text-muted)">Notes: ${item.other || "N/A"}</small><br>
                <small style="color:var(--brand-orange); font-weight:700;">ID: ${item.id}</small>
            </div>
            <button class="btn-use" onclick="window.useSheet('${item.id}')">USE</button>`;
        inventoryList.appendChild(div);
    });
}

// Search & Form Logic
['search-1', 'search-2', 'search-3'].forEach(id => {
    document.getElementById(id).oninput = () => renderInventory(currentStock);
});

matSelect.onchange = (e) => loadInventory(e.target.value);

window.useSheet = async (id) => {
    if (!confirm(`Mark ${id} as used?`)) return;
    await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: "DELETE", id, item: matSelect.value }) });
    loadInventory(matSelect.value);
};

document.getElementById('material-form').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerText = "Syncing..."; submitBtn.disabled = true;
    
    const id = (currentMode === 'Sheet' ? "SH-" : "ST-") + Math.random().toString(36).substr(2, 4).toUpperCase();
    const data = {
        action: "ADD", id, item: matSelect.value,
        thickness: document.getElementById('dim-input').value,
        size: document.getElementById('len-input').value,
        cert: document.getElementById('cert-num').value,
        loc: document.getElementById('location').value,
        other: document.getElementById('other-info').value || "N/A",
        other_type: currentMode === 'Structural' ? structTypeSelect.value : "Sheet",
        user: auth.currentUser.email
    };

    await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) });
    document.getElementById('material-form').reset();
    setMode(currentMode);
    loadInventory(data.item);
    submitBtn.innerText = "Add Entry"; submitBtn.disabled = false;
};