// ==========================================
// Firebase Config
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAOQp4Ez6omxSL5MDh_cGzzUy1gcf4KkEo",
    authDomain: "agroain.firebaseapp.com",
    databaseURL: "https://agroain-default-rtdb.firebaseio.com",
    projectId: "agroain",
    storageBucket: "agroain.firebasestorage.app",
    messagingSenderId: "837977852518",
    appId: "1:837977852518:web:eebd9baaec310f03e0bba7"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==========================================
// Global Variables
// ==========================================
let currentPackageList = [];
let allProducts = [];
let searchResultsData = [];
let currentSearchPage = 1;
const searchItemsPerPage = 5;

// ==========================================
// Product List Refresh
// ==========================================
function refreshProductList() {
    const productList = document.getElementById('productList');
    productList.innerHTML = "";
    const uniqueNames = new Set();
    const uniqueTech = new Set();
    allProducts.forEach(p => {
        if (p.name && !uniqueNames.has(p.name)) {
            uniqueNames.add(p.name);
            let opt = document.createElement('option');
            opt.value = p.name;
            productList.appendChild(opt);
        }
        if (p.technical && !uniqueTech.has(p.technical)) {
            uniqueTech.add(p.technical);
            let opt2 = document.createElement('option');
            opt2.value = p.technical;
            productList.appendChild(opt2);
        }
    });
    console.log("✅ Product list refreshed");
}

// ==========================================
// Load Inventory
// ==========================================
async function loadInventory() {
    try {
        const snap = await db.ref('inventory').once('value');
        const data = snap.val();
        allProducts = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        refreshProductList();
        console.log(`📦 Loaded ${allProducts.length} products`);
    } catch (error) { 
        console.error("Error loading inventory:", error); 
    }
}

// ==========================================
// Auto-Fill from Inventory
// ==========================================
function autoFillFromInventory() {
    let inputField = document.getElementById('inpProdName');
    let searchName = inputField.value.trim().toLowerCase();
    if (!searchName) return alert("दवाई का नाम या तकनीकी नाम लिखें!");

    let prod = allProducts.find(p => 
        (p.name && p.name.toLowerCase() === searchName) ||
        (p.technical && p.technical.toLowerCase() === searchName)
    );
    if (!prod) {
        prod = allProducts.find(p => 
            (p.name && p.name.toLowerCase().includes(searchName)) ||
            (p.technical && p.technical.toLowerCase().includes(searchName))
        );
    }

    if (prod) {
        let method = document.getElementById('treatmentMethodSelect').value;
        let dose = '';
        if (method === 'स्प्रे') dose = prod.doseSpray || prod.dose || '';
        else if (method === 'बीज उपचार') dose = prod.doseSeed || '';
        else if (method === 'खाद/मिट्टी') dose = prod.doseSoil || '';
        else if (method === 'बीज शोधन') dose = prod.doseSeed || '';
        document.getElementById('inpDose').value = dose;
        document.getElementById('inpDetails').value = prod.extraDetails || prod.details || '';
        document.getElementById('inpAdvice').value = prod.extraDetails || '';

        let alertMsg = '';
        if (prod.expiry && prod.expiry !== 'N/A') {
            const today = new Date();
            const expDate = new Date(prod.expiry);
            const diffDays = (expDate - today) / (1000*60*60*24);
            if (diffDays < 0) alertMsg = `⚠️ एक्सपायरी हो चुकी है (${prod.expiry})`;
            else if (diffDays <= 30) alertMsg = `⚠️ एक्सपायरी निकट (${Math.ceil(diffDays)} दिन बचे)`;
        }
        if (prod.qty <= (prod.minStock || 0)) alertMsg += (alertMsg? ' | ' : '') + `📉 स्टॉक कम (${prod.qty} शेष)`;
        document.getElementById('inpNoteAlert').value = alertMsg;

        if (!document.getElementById('inpPkgCompany').value) document.getElementById('inpPkgCompany').value = prod.company || "";
        if (!document.getElementById('inpPkgPrice').value || document.getElementById('inpPkgPrice').value == "0") document.getElementById('inpPkgPrice').value = prod.price || 0;
        if (!document.getElementById('inpPkgImg').value) document.getElementById('inpPkgImg').value = prod.img || "";
        if (!document.getElementById('inpPkgPacking').value) document.getElementById('inpPkgPacking').value = prod.packSize || "";
        if (!document.getElementById('inpPkgTechnical').value) document.getElementById('inpPkgTechnical').value = prod.technical || "";

        inputField.style.borderColor = "#2e7d32";
        console.log("✅ Data Loaded for:", prod.name);
        showMessage(`✅ "${prod.name || prod.technical}" की जानकारी भर दी गई!`, true);
    } else {
        alert("❌ इन्वेंटरी में यह दवाई नहीं मिली!");
        inputField.style.borderColor = "#d32f2f";
    }
}

// ==========================================
// Clear Functions
// ==========================================
function clearOtherPackageFields() {
    document.getElementById('inpPkgTechnical').value = '';
    document.getElementById('inpPkgCompany').value = '';
    document.getElementById('inpPkgPrice').value = '';
    document.getElementById('inpPkgPacking').value = '';
    document.getElementById('inpAgeMin').value = '';
    document.getElementById('inpAgeMax').value = '';
    document.getElementById('inpPackageType').value = 'बुवाई से पहले';
    document.getElementById('inpPkgImg').value = '';
}

function clearMedicineForm() {
    document.getElementById('inpProdName').value = "";
    document.getElementById('inpDose').value = "";
    document.getElementById('inpDetails').value = "";
    document.getElementById('inpAdvice').value = "";
    document.getElementById('inpNoteAlert').value = "";
    document.getElementById('treatmentMethodSelect').value = "स्प्रे";
    document.getElementById('inpProdName').style.borderColor = "#c8e6c9";
}

function clearAllForms() {
    document.getElementById('inpPkgNo').value = '';
    document.getElementById('inpCrop').value = '';
    currentPackageList = [];
    renderPackageTable();
    clearMedicineForm();
    clearOtherPackageFields();
}

function showMessage(message, isSuccess = true) {
    const msgEl = document.getElementById('addMessage');
    msgEl.textContent = message;
    msgEl.style.background = isSuccess ? '#c8e6c9' : '#ffcdd2';
    msgEl.style.color = isSuccess ? '#1b5e20' : '#c62828';
    msgEl.classList.add('show');
    setTimeout(() => msgEl.classList.remove('show'), 2000);
}

// ==========================================
// ADD ITEM TO PACKAGE
// ==========================================
function addItemToPackage() {
    const name = document.getElementById('inpProdName').value.trim();
    const technical = document.getElementById('inpPkgTechnical').value.trim();
    const dose = document.getElementById('inpDose').value.trim();
    const treatmentMethod = document.getElementById('treatmentMethodSelect').value;
    const details = document.getElementById('inpDetails').value.trim();
    const advice = document.getElementById('inpAdvice').value.trim();
    const noteAlert = document.getElementById('inpNoteAlert').value.trim();
    const company = document.getElementById('inpPkgCompany').value.trim();
    const price = document.getElementById('inpPkgPrice').value.trim();
    const packing = document.getElementById('inpPkgPacking').value.trim();
    const ageMin = document.getElementById('inpAgeMin').value.trim() || "0";
    const ageMax = document.getElementById('inpAgeMax').value.trim() || "0";
    const imgUrl = document.getElementById('inpPkgImg').value.trim();
    
    if(name === "" || dose === "") {
        alert("❌ Kripya Dawai ka Naam aur Dose bharein!");
        return;
    }

    currentPackageList.push({ 
        id: Date.now() + Math.random(), 
        prodName: name, 
        technical: technical,
        dose: dose,
        treatmentMethod: treatmentMethod,
        details: details, 
        advice: advice, 
        noteAlert: noteAlert,
        company: company,
        price: price,
        packing: packing,
        ageRange: `${ageMin}-${ageMax} Din`,
        img: imgUrl
    });
    
    clearMedicineForm(); 
   // clearOtherPackageFields(); 
    renderPackageTable();
    showMessage(`✅ "${name}" niche list mein jod di gayi hai!`);
}

// ==========================================
// RENDER PACKAGE TABLE
// ==========================================
function renderPackageTable() {
    const tbody = document.getElementById('medicineTableBody');
    tbody.innerHTML = "";
    
    if (currentPackageList.length === 0) {
        tbody.innerHTML = "<tr><td colspan='11' style='text-align:center'>Abhi koi dawai nahi jodi gayi</td></tr>";
        return;
    }

    currentPackageList.forEach((item) => {
        const row = tbody.insertRow();
        row.insertCell(0).innerHTML = `<b>${item.prodName}</b>`;
        row.insertCell(1).textContent = item.technical;
        row.insertCell(2).textContent = item.dose;
        row.insertCell(3).textContent = item.treatmentMethod;
        row.insertCell(4).textContent = item.company;
        row.insertCell(5).textContent = `₹${item.price}`;
        row.insertCell(6).textContent = item.packing;
        row.insertCell(7).textContent = item.ageRange;
        row.insertCell(8).innerHTML = `<small><b>Details:</b> ${item.details}<br><b>Salah:</b> ${item.advice}<br><b>Note:</b> ${item.noteAlert}</small>`;
        
        const imgCell = row.insertCell(9);
        if(item.img) {
            imgCell.innerHTML = `<img src="${item.img}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">`;
        } else {
            imgCell.textContent = "N/A";
        }

        const delBtn = document.createElement('button');
        delBtn.textContent = "✖";
        delBtn.className = "del-btn";
        delBtn.onclick = () => deleteItemById(item.id);
        row.insertCell(10).appendChild(delBtn);
    });
}

function deleteItemById(id) {
    currentPackageList = currentPackageList.filter(i => i.id != id);
    renderPackageTable();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==========================================
// SAVE PACKAGE (UPDATED - Extra fields bhi save honge)
// ==========================================
async function savePackageToFirebase() {
    const pkgNo = document.getElementById('inpPkgNo').value.trim();
    const cropValue = document.getElementById('inpCrop').value.trim();
    const packageType = document.getElementById('inpPackageType').value;
    
    if(!pkgNo || !cropValue) { 
        alert("❌ पैकेज नंबर और फसल का नाम जरूरी है!"); 
        return; 
    }
    if(currentPackageList.length === 0) { 
        alert("❌ पहले कम से कम एक दवाई जोड़ें!"); 
        return; 
    }

    const data = {
        pkgNo: pkgNo,
        crop: cropValue,
        packageType: packageType,
        technical: document.getElementById('inpPkgTechnical').value,
        company: document.getElementById('inpPkgCompany').value,
        price: document.getElementById('inpPkgPrice').value,
        packing: document.getElementById('inpPkgPacking').value,
        ageMin: document.getElementById('inpAgeMin').value || 0,
        ageMax: document.getElementById('inpAgeMax').value || 999,
        img: document.getElementById('inpPkgImg').value,
        dType: "पैकेज",
        items: currentPackageList 
    };

    try {
        await db.ref('packages/' + pkgNo).set(data);
        alert("✅ पैकेज सफलतापूर्वक सुरक्षित (Save) हो गया!");
        clearAllForms();
    } catch (error) {
        alert("❌ एरर: " + error.message);
    }
}

// ==========================================
// Delete Package
// ==========================================
async function deleteFullPackage() {
    const pkgNo = document.getElementById('inpPkgNo').value;
    if(!pkgNo) return alert("❌ पहले पैकेज नंबर भरिए!");
    if(confirm(`⚠️ क्या आप Package Number ${pkgNo} को DELETE करना चाहते हैं?`)) {
        try {
            await db.ref('packages/' + pkgNo).remove();
            alert("✅ पैकेज डिलीट हो गया!");
            clearAllForms();
        } catch (error) { alert("❌ एरर: " + error.message); }
    }
}

// ==========================================
// Search with Pagination
// ==========================================
function renderSearchPagination() {
    const totalPages = Math.ceil(searchResultsData.length / searchItemsPerPage);
    const paginationDiv = document.getElementById('searchPagination');
    if (totalPages <= 1) {
        paginationDiv.innerHTML = searchResultsData.length > 0 ? `<div class="pagination-summary">📄 कुल ${searchResultsData.length} पैकेज मिले</div>` : '';
        return;
    }
    const startItem = (currentSearchPage - 1) * searchItemsPerPage + 1;
    const endItem = Math.min(currentSearchPage * searchItemsPerPage, searchResultsData.length);
    let btns = `<div class="pagination-summary">📄 ${startItem}-${endItem} दिख रहे हैं (कुल ${searchResultsData.length} में से) · पेज ${currentSearchPage}/${totalPages}</div>`;
    btns += `<button class="page-btn nav-btn" onclick="goToSearchPage(${currentSearchPage - 1})" ${currentSearchPage === 1 ? 'disabled' : ''}>« पिछला</button>`;
    if (currentSearchPage > 3) { btns += `<button class="page-btn" onclick="goToSearchPage(1)">1</button>`; if (currentSearchPage > 4) btns += `<button class="page-btn" disabled>…</button>`; }
    for (let i = Math.max(1, currentSearchPage - 2); i <= Math.min(totalPages, currentSearchPage + 2); i++) {
        btns += `<button class="page-btn ${i === currentSearchPage ? 'active' : ''}" onclick="goToSearchPage(${i})" ${i === currentSearchPage ? 'disabled' : ''}>${i}</button>`;
    }
    if (currentSearchPage < totalPages - 2) { if (currentSearchPage < totalPages - 3) btns += `<button class="page-btn" disabled>…</button>`; btns += `<button class="page-btn" onclick="goToSearchPage(${totalPages})">${totalPages}</button>`; }
    btns += `<button class="page-btn nav-btn" onclick="goToSearchPage(${currentSearchPage + 1})" ${currentSearchPage === totalPages ? 'disabled' : ''}>अगला »</button>`;
    btns += `<div class="page-jump"><input type="number" id="searchJumpInput" min="1" max="${totalPages}" placeholder="${currentSearchPage}" onkeypress="if(event.key==='Enter')jumpToSearchPage(${totalPages})"><button onclick="jumpToSearchPage(${totalPages})">जाएं</button></div>`;
    paginationDiv.innerHTML = btns;
}

function goToSearchPage(page) { 
    currentSearchPage = page; 
    renderSearchResultsPage(); 
    document.getElementById('searchResults').scrollIntoView({ behavior: 'smooth' }); 
}

function jumpToSearchPage(totalPages) {
    const inputEl = document.getElementById('searchJumpInput');
    const pageNum = parseInt(inputEl.value);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) { 
        alert(`⚠️ कृपया 1 से ${totalPages} के बीच पेज नंबर डालें`); 
        inputEl.value = ''; 
        inputEl.focus(); 
        return; 
    }
    goToSearchPage(pageNum);
}

function renderSearchResultsPage() {
    const resDiv = document.getElementById('searchResults');
    const start = (currentSearchPage - 1) * searchItemsPerPage;
    const end = start + searchItemsPerPage;
    const pageItems = searchResultsData.slice(start, end);
    let html = '';
    pageItems.forEach(item => { html += item.html; });
    resDiv.innerHTML = html;
    renderSearchPagination();
}

async function findPackagesByCrop() {
    const sCrop = document.getElementById('searchCrop').value.trim().toLowerCase();
    const sAge = parseInt(document.getElementById('searchAge').value);
    const resDiv = document.getElementById('searchResults');
    const paginationDiv = document.getElementById('searchPagination');
    if(!sCrop || isNaN(sAge)) { resDiv.innerHTML = "⚠️ कृपया फसल और उम्र दोनों भरें"; paginationDiv.innerHTML = ""; return; }
    resDiv.innerHTML = "खोज रहे हैं..."; paginationDiv.innerHTML = "";
    const snap = await db.ref('packages').once('value');
    const data = snap.val();
    searchResultsData = [];
    for (let id in data) {
        let p = data[id];
        let pAgeMin = parseInt(p.ageMin) || 0;
        let pAgeMax = parseInt(p.ageMax) || 999;
        if (p.crop && p.crop.toLowerCase().includes(sCrop) && sAge >= pAgeMin && sAge <= pAgeMax) {
            searchResultsData.push({
                id: id,
                html: `<div style="background:white; padding:10px; margin:5px; border-radius:5px; border-left:5px solid green; cursor:pointer" onclick="loadPkg('${id}')"><b>📦 पैकेज ${p.pkgNo}</b> - ${p.crop} (${pAgeMin}-${pAgeMax} दिन) - ${p.items ? p.items.length : 0} दवाइयाँ<br><small>🏢 ${p.company || 'Agroain'} | 💰 ₹${p.price || 0} | 📦 ${p.packing || '1 Kit'}</small></div>`
            });
        }
    }
    currentSearchPage = 1;
    if (searchResultsData.length === 0) { resDiv.innerHTML = "❌ कोई मैच नहीं मिला"; paginationDiv.innerHTML = ""; }
    else { renderSearchResultsPage(); }
}

// ==========================================
// LOAD PACKAGE (UPDATED - Saare fields properly load honge)
// ==========================================
function loadPkg(id) {
    db.ref('packages/' + id).once('value', snap => {
        const p = snap.val();
        if (!p) {
            alert("डेटा नहीं मिला!");
            return;
        }

        // 1. Basic Fields
        document.getElementById('inpPkgNo').value = p.pkgNo || '';
        document.getElementById('inpCrop').value = p.crop || '';
        document.getElementById('inpPackageType').value = p.packageType || "बुवाई से पहले";
        
        // 2. Extra Fields (Jo ab save bhi ho rahe hain)
        document.getElementById('inpPkgTechnical').value = p.technical || '';
        document.getElementById('inpPkgCompany').value = p.company || '';
        document.getElementById('inpPkgPrice').value = p.price || 0;
        document.getElementById('inpPkgPacking').value = p.packing || '';
        document.getElementById('inpAgeMin').value = p.ageMin || 0;
        document.getElementById('inpAgeMax').value = p.ageMax || 999;
        document.getElementById('inpPkgImg').value = p.img || '';

        // 3. Package Items List
        currentPackageList = (p.items || []).map(item => ({
            id: item.id || Date.now() + Math.random(),
            prodName: item.prodName || item.name || '',
            technical: item.technical || '',
            dose: item.dose || '',
            treatmentMethod: item.treatmentMethod || "स्प्रे",
            details: item.details || '',
            advice: item.advice || '',
            noteAlert: item.noteAlert || '',
            company: item.company || '',
            price: item.price || 0,
            packing: item.packing || '',
            ageRange: item.ageRange || '0-0 Din',
            img: item.img || ''
        }));

        // 4. Table Refresh
        renderPackageTable(); 
        
        // 5. Cleanup
        clearMedicineForm();
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('searchPagination').innerHTML = '';
        
        // 6. Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log("✅ Package loaded successfully!");
    });
}

// ==========================================
// Initialize
// ==========================================
window.onload = async () => {
    await loadInventory();
    document.getElementById('treatmentMethodSelect').addEventListener('change', function() {
        const prodName = document.getElementById('inpProdName').value.trim();
        if (prodName) autoFillFromInventory();
    });
};