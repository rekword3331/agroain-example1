// ==========================================
// Firebase Configuration
// ==========================================
const DB_URL = "https://agroain-default-rtdb.firebaseio.com/"; 
const ADMIN_PIN = "1234";

let allProducts = [];
let displayProducts = [];
let loaderCounter = 0;

// ==========================================
// Utility Functions
// ==========================================
function checkAccess() {
    const pin = prompt("कृपया एडमिन PIN दर्ज करें:");
    if (pin === ADMIN_PIN) return true;
    alert("❌ गलत PIN! आप बदलाव नहीं कर सकते।");
    return false;
}

function showLoader() {
    loaderCounter++;
    document.getElementById('loaderOverlay').classList.add('show');
}

function hideLoader() {
    loaderCounter--;
    if (loaderCounter <= 0) {
        document.getElementById('loaderOverlay').classList.remove('show');
        loaderCounter = 0;
    }
}

function previewFromURL(url) {
    const previewImg = document.getElementById('previewImg');
    if (url && url.trim() !== '') {
        previewImg.src = url.trim();
        previewImg.style.display = 'block';
    } else {
        previewImg.src = '';
        previewImg.style.display = 'none';
    }
}

// ==========================================
// Form Functions
// ==========================================
function toggleFields() {
    const cat = document.getElementById('pCat').value;
    document.getElementById('dawaiBox').style.display = cat === 'dawai' ? 'block' : 'none';
}

document.getElementById('dPack').addEventListener('change', function() {
    const otherInput = document.getElementById('dPackOther');
    otherInput.style.display = this.value === 'other' ? 'block' : 'none';
});

function getFormData() {
    const name = document.getElementById('pName').value.trim();
    const tech = document.getElementById('dTech').value.trim();
    const combined = (name + " " + tech).toLowerCase();
    const words = combined.split(/[\s,]+/).filter(word => word.length > 2);
    const searchKeywords = [...new Set(words)];
    const bill = parseFloat(document.getElementById('pBill').value) || 0;
    const paid = parseFloat(document.getElementById('pPaid').value) || 0;
    let packSize = document.getElementById('dPack').value;
    if (packSize === 'other') packSize = document.getElementById('dPackOther').value.trim() || 'अन्य';
    
    return {
        name, searchKeywords,
        cat: document.getElementById('pCat').value,
        company: document.getElementById('pComp').value.trim(),
        distributor: document.getElementById('pDist').value.trim(),
        buyDate: document.getElementById('pBuyDate').value || 'N/A',
        expiry: document.getElementById('pExpiry').value || 'N/A',
        qty: parseInt(document.getElementById('pQty').value) || 0,
        price: parseFloat(document.getElementById('pPrice').value) || 0,
        bill, paid, pending: bill - paid,
        img: document.getElementById('pImgURL').value.trim() || 'https://via.placeholder.com/100?text=No+Image',
        dType: document.getElementById('dType').value || '',
        technical: tech,
        serial: document.getElementById('dSerial').value.trim() || 'N/A',
        minStock: parseInt(document.getElementById('dMinStock').value) || 0,
        crops: document.getElementById('dCrops').value.trim() || '',
        packSize,
        combineType: document.getElementById('dCombineType').value,
        combineWith: document.getElementById('dCombineWith').value.trim() || '',
        doseSeed: document.getElementById('dDoseSeed').value.trim() || '—',
        doseSpray: document.getElementById('dDoseSpray').value.trim() || '—',
        doseSoil: document.getElementById('dDoseSoil').value.trim() || '—',
        partner: document.getElementById('dPartner').value.trim() || 'No Partner',
        specialLogic: document.getElementById('dSpecialLogic').value.trim() || 'Standard Dose',
        extraDetails: document.getElementById('dExtraDetails').value.trim() || ''
    };
}

function fillFormWithProduct(p) {
    document.getElementById('pName').value = p.name || '';
    document.getElementById('pCat').value = p.cat || 'hardware';
    document.getElementById('pComp').value = p.company || '';
    document.getElementById('pDist').value = p.distributor || '';
    document.getElementById('pBuyDate').value = p.buyDate || '';
    document.getElementById('pExpiry').value = p.expiry || '';
    document.getElementById('pQty').value = p.qty || 0;
    document.getElementById('pPrice').value = p.price || 0;
    document.getElementById('pBill').value = p.bill || 0;
    document.getElementById('pPaid').value = p.paid || 0;
    document.getElementById('dType').value = p.dType || '';
    document.getElementById('dTech').value = p.technical || '';
    document.getElementById('dSerial').value = p.serial || '';
    document.getElementById('dMinStock').value = p.minStock || 0;
    document.getElementById('dCrops').value = p.crops || '';
    
    const packSelect = document.getElementById('dPack');
    const otherInput = document.getElementById('dPackOther');
    if (p.packSize && !Array.from(packSelect.options).some(opt => opt.value === p.packSize)) {
        packSelect.value = 'other';
        otherInput.style.display = 'block';
        otherInput.value = p.packSize;
    } else {
        packSelect.value = p.packSize || '';
        otherInput.style.display = 'none';
        otherInput.value = '';
    }
    
    document.getElementById('dCombineType').value = p.combineType || 'single';
    document.getElementById('dCombineWith').value = p.combineWith || '';
    document.getElementById('dDoseSeed').value = p.doseSeed || '';
    document.getElementById('dDoseSpray').value = p.doseSpray || '';
    document.getElementById('dDoseSoil').value = p.doseSoil || '';
    document.getElementById('dPartner').value = p.partner || '';
    document.getElementById('dSpecialLogic').value = p.specialLogic || '';
    document.getElementById('dExtraDetails').value = p.extraDetails || '';
    
    if (p.img && p.img !== 'https://via.placeholder.com/100?text=No+Image') {
        document.getElementById('previewImg').src = p.img;
        document.getElementById('previewImg').style.display = 'block';
        document.getElementById('pImgURL').value = p.img;
    } else {
        document.getElementById('previewImg').style.display = 'none';
        document.getElementById('pImgURL').value = '';
    }
    
    toggleFields();
}

function clearForm() {
    document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(el => {
        if (el.id !== 'pCat' && el.id !== 'dPackOther') el.value = '';
    });
    document.getElementById('pCat').value = 'hardware';
    document.getElementById('dawaiBox').style.display = 'none';
    document.getElementById('previewImg').style.display = 'none';
    document.getElementById('previewImg').src = '';
    document.getElementById('pImgURL').value = '';
    document.getElementById('dPackOther').style.display = 'none';
    document.getElementById('dPackOther').value = '';
    document.getElementById('dExtraDetails').value = '';
    document.getElementById('editId').value = '';
    document.getElementById('sourceProductId').value = '';
    document.getElementById('copyBanner').classList.remove('show');
}

function cancelEdit() {
    clearForm();
    document.getElementById('addBtn').style.display = 'block';
    document.getElementById('updateBtn').style.display = 'none';
    document.getElementById('newVersionBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('copyBanner').classList.remove('show');
    document.getElementById('editId').value = '';
    document.getElementById('sourceProductId').value = '';
}

// ==========================================
// CRUD Operations
// ==========================================
async function loadData() {
    showLoader();
    try {
        const res = await fetch(`${DB_URL}inventory.json`);
        const data = await res.json();
        allProducts = [];
        if (data) {
            Object.keys(data).forEach(key => {
                if (data[key]) {
                    allProducts.push({ ...data[key], id: key });
                }
            });
        }
        displayProducts = [...allProducts];
        renderTable(displayProducts);
        updateStats();
        console.log("Data loaded:", allProducts.length);
    } catch (e) {
        console.error("Load Error:", e);
    } finally {
        hideLoader();
    }
}

async function saveProduct() {
    if (!document.getElementById('pName').value.trim()) return alert("उत्पाद नाम अनिवार्य है।");
    if (!checkAccess()) return;
    const btn = document.getElementById('addBtn');
    btn.innerText = "सेव हो रहा...";
    btn.disabled = true;
    showLoader();
    try {
        const data = getFormData();
        await fetch(`${DB_URL}inventory.json`, { method: 'POST', body: JSON.stringify(data) });
        alert("✅ प्रोडक्ट सफलतापूर्वक जोड़ दिया गया है!");
        clearForm();
        await loadData();
    } catch(e) { 
        alert("❌ सेव नहीं हुआ, नेटवर्क चेक करें।"); 
    } finally { 
        hideLoader(); 
        btn.innerText = "➕ स्टॉक में जोड़ें"; 
        btn.disabled = false; 
    }
}

async function saveAsNewVersion() {
    if (!document.getElementById('pName').value.trim()) return alert("उत्पाद नाम अनिवार्य है।");
    if (!checkAccess()) return;
    
    document.getElementById('editId').value = '';
    
    const btn = document.getElementById('newVersionBtn');
    btn.innerText = "जोड़ रहे हैं...";
    btn.disabled = true;
    showLoader();
    try {
        const data = getFormData();
        await fetch(`${DB_URL}inventory.json`, { method: 'POST', body: JSON.stringify(data) });
        alert("✅ नया वर्जन सफलतापूर्वक जोड़ दिया गया है!");
        clearForm();
        await loadData();
    } catch(e) { 
        alert("❌ सेव नहीं हुआ, नेटवर्क चेक करें।"); 
    } finally { 
        hideLoader(); 
        btn.innerText = "🆕 नया वर्जन जोड़ें"; 
        btn.disabled = false; 
    }
}

function editItem(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    
    document.getElementById('editId').value = p.id;
    document.getElementById('sourceProductId').value = '';
    document.getElementById('copyBanner').classList.remove('show');
    
    fillFormWithProduct(p);
    
    document.getElementById('addBtn').style.display = 'none';
    document.getElementById('updateBtn').style.display = 'block';
    document.getElementById('newVersionBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function updateProduct() {
    const id = document.getElementById('editId').value;
    if (!id) return;
    if (!checkAccess()) return;
    const btn = document.getElementById('updateBtn');
    btn.innerText = "अपडेट हो रहा...";
    btn.disabled = true;
    showLoader();
    try {
        const data = getFormData();
        await fetch(`${DB_URL}inventory/${id}.json`, { method: 'PUT', body: JSON.stringify(data) });
        alert("⚡ प्रोडक्ट अपडेट हो गया है!");
        cancelEdit();
        await loadData();
    } catch(e) { 
        alert("❌ अपडेट विफल रहा"); 
    } finally { 
        hideLoader(); 
        btn.innerText = "⚡ अपडेट करें"; 
        btn.disabled = false; 
    }
}

async function deleteItem(id) {
    if (!checkAccess()) return;
    if (!confirm("क्या आप निश्चित हैं? यह आइटम डिलीट हो जाएगा।")) return;
    showLoader();
    try {
        await fetch(`${DB_URL}inventory/${id}.json`, { method: 'DELETE' });
        loadData();
    } catch(e) { 
        alert("डिलीट नहीं हो सका"); 
        hideLoader(); 
    }
}

async function sellItem(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    const sellQty = prompt(`कितना माल बेचना है? (उपलब्ध स्टॉक: ${product.qty})`, "1");
    if (sellQty === null) return;
    const qtyNum = parseInt(sellQty);
    if (isNaN(qtyNum) || qtyNum <= 0) return alert("सही संख्या दर्ज करें!");
    if (qtyNum > product.qty) return alert("स्टॉक में पर्याप्त माल नहीं है!");

    const newQty = product.qty - qtyNum;
    showLoader();
    try {
        await fetch(`${DB_URL}inventory/${id}/qty.json`, {
            method: 'PUT',
            body: JSON.stringify(newQty)
        });
        alert(`${qtyNum} माल बिक गया। नया स्टॉक: ${newQty}`);
        loadData();
    } catch (e) {
        alert("बिक्री दर्ज नहीं हुई, फिर प्रयास करें।");
        hideLoader();
    }
}

// ==========================================
// Display Functions
// ==========================================
function getAlertClass(product) {
    const today = new Date();
    let alertClass = '';
    if (product.expiry && product.expiry !== 'N/A') {
        const expDate = new Date(product.expiry);
        const diffDays = (expDate - today) / (1000 * 60 * 60 * 24);
        if (diffDays < 0) alertClass = 'expired-alert';
        else if (diffDays <= 30) alertClass = 'near-expiry-alert';
    }
    if (product.qty <= product.minStock) alertClass = alertClass ? alertClass + ' low-stock-alert' : 'low-stock-alert';
    return alertClass;
}

function highlightSameTech(techName) {
    document.querySelectorAll('tr').forEach(tr => tr.classList.remove('highlight-tech-row'));
    if(!techName || techName === '—') return;
    const rows = document.querySelectorAll('#inventoryBody tr');
    rows.forEach(row => {
        if(row.getAttribute('data-tech') === techName.toLowerCase().trim()) row.classList.add('highlight-tech-row');
    });
    alert(`🔬 Technical: "${techName}" वाले सभी प्रोडक्ट हाईलाइट कर दिए गए हैं।`);
}

function renderTable(productsArray) {
    const tbody = document.getElementById('inventoryBody');
    tbody.innerHTML = '';
    productsArray.forEach(p => {
        const alertClass = getAlertClass(p);
        const row = document.createElement('tr');
        let catClass = '';
        if (p.cat === 'dawai') {
            const typeMap = {
                'बीज उपचार': 'bg-beej-upchar',
                'Harbicide': 'bg-herbicide',
                'Insecticide': 'bg-insecticide',
                'Fungicide': 'bg-fungicide',
                'Growth': 'bg-growth',
                'Chipko': 'bg-chipko'
            };
            catClass = typeMap[p.dType] || '';
        }
        row.className = `${alertClass} ${catClass}`;
        row.setAttribute('data-tech', (p.technical || '').toLowerCase().trim());
        let combineInfo = '—';
        if (p.cat === 'dawai') {
            combineInfo = `
                🌱 बीज: ${p.doseSeed}<br>
                💦 स्प्रे: ${p.doseSpray}<br>
                🪴 मिट्टी: ${p.doseSoil}<br>
                🤝 पार्टनर: ${p.partner}<br>
                📊 ${p.specialLogic}<br>
                📦 पैक: ${p.packSize}<br>
                ⚙️ ${p.combineType === 'multiple' ? 'मिश्रण: '+p.combineWith : 'एकल'}<br>
                📄 <strong>विवरण:</strong> ${p.extraDetails ? p.extraDetails : '—'}
            `;
        }
        row.innerHTML = `
            <td><img src="${p.img}" class="prod-img" onerror="this.src='https://via.placeholder.com/100?text=Error'"></td>
            <td>
                <strong style="font-size:1.1rem;">${p.name}</strong><br>
                <span class="tech-clickable" onclick="highlightSameTech('${p.technical}')">
                    <b>${p.technical || '—'}</b>
                </span><br>
                <small style="background:#fff; border:1px solid #ccc; padding:2px 6px; border-radius:4px; font-size:10px;">SN: ${p.serial}</small>
            </td>
            <td>${combineInfo}</td>
            <td>${p.crops || '—'}</td>
            <td>${p.company}<br><small>Exp: ${p.expiry}</small></td>
            <td><span style="font-size:1.3rem; font-weight:800;">${p.qty}</span> <small>(min ${p.minStock})</small></td>
            <td>₹ ${p.price}</td>
            <td><span class="${p.pending > 0 ? 'pending-text' : 'paid-text'}">₹ ${p.pending}</span></td>
            <td>
                <button class="action-btn btn-detail" onclick="showDetails('${p.id}')">📋</button>
                <button class="action-btn btn-sale" onclick="sellItem('${p.id}')">🛒</button>
                <button class="action-btn btn-edit" onclick="editItem('${p.id}')">✎</button>
                <button class="action-btn btn-del" onclick="deleteItem('${p.id}')">🗑</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateStats() {
    const totalItems = allProducts.length;
    const totalStock = allProducts.reduce((acc, p) => acc + (p.qty || 0), 0);
    const totalDues = allProducts.reduce((acc, p) => acc + (p.pending || 0), 0);
    document.getElementById('statProd').innerText = totalItems;
    document.getElementById('statStock').innerText = totalStock;
    document.getElementById('statDues').innerText = totalDues.toFixed(0);
}

// ==========================================
// Modal Functions
// ==========================================
function showDetails(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalDetailContent');
    let html = `<div style="text-align:center; margin-bottom:15px;"><img src="${product.img}" style="max-width:150px; border-radius:20px; border:3px solid #2e7d32;"></div>`;
    html += `<div class="detail-row"><span class="detail-label">नाम:</span><span class="detail-value">${product.name || '—'}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">श्रेणी:</span><span class="detail-value">${product.cat === 'dawai' ? 'दवाई' : 'हार्डवेयर/बीज'}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">कंपनी:</span><span class="detail-value">${product.company || '—'}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">डिस्ट्रिब्यूटर:</span><span class="detail-value">${product.distributor || '—'}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">खरीद तिथि:</span><span class="detail-value">${product.buyDate || '—'}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">एक्सपायरी:</span><span class="detail-value">${product.expiry || '—'}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">स्टॉक:</span><span class="detail-value">${product.qty} (न्यूनतम: ${product.minStock})</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">मूल्य:</span><span class="detail-value">₹ ${product.price}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">बिल:</span><span class="detail-value">₹ ${product.bill}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">भुगतान:</span><span class="detail-value">₹ ${product.paid}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">बकाया:</span><span class="detail-value">₹ ${product.pending}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">बैच/सीरियल:</span><span class="detail-value">${product.serial || '—'}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">पैक आकार:</span><span class="detail-value">${product.packSize || '—'}</span></div>`;
    if (product.cat === 'dawai') {
        html += `<div class="detail-row"><span class="detail-label">दवाई प्रकार:</span><span class="detail-value">${product.dType || '—'}</span></div>`;
        html += `<div class="detail-row"><span class="detail-label">तकनीकी नाम:</span><span class="detail-value">${product.technical || '—'}</span></div>`;
        html += `<div class="detail-row"><span class="detail-label">बीज डोज़:</span><span class="detail-value">${product.doseSeed || '—'}</span></div>`;
        html += `<div class="detail-row"><span class="detail-label">स्प्रे डोज़:</span><span class="detail-value">${product.doseSpray || '—'}</span></div>`;
        html += `<div class="detail-row"><span class="detail-label">मिट्टी डोज़:</span><span class="detail-value">${product.doseSoil || '—'}</span></div>`;
        html += `<div class="detail-row"><span class="detail-label">पार्टनर:</span><span class="detail-value">${product.partner || '—'}</span></div>`;
        html += `<div class="detail-row"><span class="detail-label">स्पेशल लॉजिक:</span><span class="detail-value">${product.specialLogic || '—'}</span></div>`;
        html += `<div class="detail-row"><span class="detail-label">अतिरिक्त विवरण:</span><span class="detail-value">${product.extraDetails ? product.extraDetails : '—'}</span></div>`;
        html += `<div class="detail-row"><span class="detail-label">प्रकार:</span><span class="detail-value">${product.combineType === 'multiple' ? 'मिश्रण' : 'एकल'}</span></div>`;
        html += `<div class="detail-row"><span class="detail-label">मिश्रण साथी:</span><span class="detail-value">${product.combineWith || '—'}</span></div>`;
        html += `<div class="detail-row"><span class="detail-label">फसलें:</span><span class="detail-value">${product.crops || '—'}</span></div>`;
    }
    content.innerHTML = html;
    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('detailModal').classList.remove('show');
}

// ==========================================
// Search Function
// ==========================================
document.getElementById('search').addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase().trim();
    
    if (term === '') {
        displayProducts = [...allProducts];
    } else if (term === 'low stock') {
        displayProducts = allProducts.filter(p => p.qty <= (p.minStock || 0));
    } else if (term === 'near expiry') {
        const today = new Date();
        displayProducts = allProducts.filter(p => {
            if (!p.expiry || p.expiry === 'N/A') return false;
            const diffDays = (new Date(p.expiry) - today) / (1000*60*60*24);
            return diffDays > 0 && diffDays <= 30;
        });
    } else if (term === 'expired') {
        const today = new Date();
        displayProducts = allProducts.filter(p => {
            if (!p.expiry || p.expiry === 'N/A') return false;
            return new Date(p.expiry) < today;
        });
    } else {
        displayProducts = allProducts.filter(p => 
            (p.name && p.name.toLowerCase().includes(term)) ||
            (p.dType && p.dType.toLowerCase().includes(term)) ||
            (p.serial && p.serial.toLowerCase().includes(term)) ||
            (p.technical && p.technical.toLowerCase().includes(term)) ||
            (p.company && p.company.toLowerCase().includes(term)) ||
            (p.crops && p.crops.toLowerCase().includes(term)) ||
            (p.partner && p.partner.toLowerCase().includes(term)) ||
            (p.specialLogic && p.specialLogic.toLowerCase().includes(term)) ||
            (p.extraDetails && p.extraDetails.toLowerCase().includes(term)) ||
            (p.searchKeywords && p.searchKeywords.some(kw => kw.includes(term)))
        );
    }
    renderTable(displayProducts);
});

// ==========================================
// Backup Function
// ==========================================
function backupData() {
    const dataStr = JSON.stringify(allProducts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agroen_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ==========================================
// Auto-Fill Functions
// ==========================================
function autoFillDoseDetailsOnly(product) {
    if (!product) return;
    
    document.getElementById('dType').value = product.dType || '';
    document.getElementById('dCrops').value = product.crops || '';
    document.getElementById('dDoseSeed').value = product.doseSeed || '';
    document.getElementById('dDoseSpray').value = product.doseSpray || '';
    document.getElementById('dDoseSoil').value = product.doseSoil || '';
    document.getElementById('dPartner').value = product.partner || '';
    document.getElementById('dSpecialLogic').value = product.specialLogic || '';
    document.getElementById('dExtraDetails').value = product.extraDetails || '';
    document.getElementById('dCombineType').value = product.combineType || 'single';
    document.getElementById('dCombineWith').value = product.combineWith || '';
    
    if (product.cat === 'dawai') {
        document.getElementById('pCat').value = 'dawai';
        toggleFields();
    }
}

// ==========================================
// Live Search Setup Functions
// ==========================================
function setupProductNameSearch() {
    const input = document.getElementById('pName');
    const box = document.getElementById('pNameSuggestions');
    let activeIndex = -1;

    input.addEventListener('input', function() {
        const term = this.value.trim().toLowerCase();
        if (term.length < 1) { box.style.display = 'none'; return; }
        
        const suggestions = [];
        const seen = new Set();
        
        allProducts.forEach(p => {
            if (p.name && p.name.toLowerCase().includes(term)) {
                const key = p.name.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    suggestions.push(p);
                }
            }
        });

        if (suggestions.length === 0) { box.style.display = 'none'; return; }

        box.innerHTML = '';
        suggestions.slice(0, 8).forEach((prod) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `<strong>${prod.name}</strong><small>${prod.company || ''} | ${prod.technical || ''} | ${prod.packSize || ''}</small>`;
            
            div.addEventListener('click', () => {
                input.value = prod.name;
                fillFormWithProduct(prod);
                document.getElementById('editId').value = '';
                document.getElementById('sourceProductId').value = prod.id;
                
                document.getElementById('addBtn').style.display = 'none';
                document.getElementById('updateBtn').style.display = 'none';
                document.getElementById('newVersionBtn').style.display = 'block';
                document.getElementById('cancelBtn').style.display = 'block';
                document.getElementById('copyBanner').classList.add('show');
                
                box.style.display = 'none';
            });
            box.appendChild(div);
        });
        box.style.display = 'block';
        activeIndex = -1;
    });

    input.addEventListener('keydown', (e) => {
        const items = box.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % items.length;
            items.forEach((item, i) => item.classList.toggle('active-suggestion', i === activeIndex));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + items.length) % items.length;
            items.forEach((item, i) => item.classList.toggle('active-suggestion', i === activeIndex));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && items[activeIndex]) {
                items[activeIndex].click();
            }
            box.style.display = 'none';
        } else if (e.key === 'Escape') {
            box.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !box.contains(e.target)) box.style.display = 'none';
    });
}

function setupCompanySearch() {
    const input = document.getElementById('pComp');
    const box = document.getElementById('pCompSuggestions');
    let activeIndex = -1;

    input.addEventListener('input', function() {
        const term = this.value.trim().toLowerCase();
        if (term.length < 1) { box.style.display = 'none'; return; }
        
        const suggestions = [];
        const seen = new Set();
        
        allProducts.forEach(p => {
            if (p.company && p.company.toLowerCase().includes(term)) {
                const key = p.company.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    suggestions.push(p.company);
                }
            }
        });

        if (suggestions.length === 0) { box.style.display = 'none'; return; }

        box.innerHTML = '';
        suggestions.slice(0, 8).forEach((comp) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `<strong>${comp}</strong>`;
            
            div.addEventListener('click', () => {
                input.value = comp;
                box.style.display = 'none';
            });
            box.appendChild(div);
        });
        box.style.display = 'block';
    });

    input.addEventListener('keydown', (e) => {
        const items = box.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % items.length;
            items.forEach((item, i) => item.classList.toggle('active-suggestion', i === activeIndex));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + items.length) % items.length;
            items.forEach((item, i) => item.classList.toggle('active-suggestion', i === activeIndex));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && items[activeIndex]) {
                items[activeIndex].click();
            }
            box.style.display = 'none';
        } else if (e.key === 'Escape') {
            box.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !box.contains(e.target)) box.style.display = 'none';
    });
}

function setupDistributorSearch() {
    const input = document.getElementById('pDist');
    const box = document.getElementById('pDistSuggestions');
    let activeIndex = -1;

    input.addEventListener('input', function() {
        const term = this.value.trim().toLowerCase();
        if (term.length < 1) { box.style.display = 'none'; return; }
        
        const suggestions = [];
        const seen = new Set();
        
        allProducts.forEach(p => {
            if (p.distributor && p.distributor.toLowerCase().includes(term)) {
                const key = p.distributor.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    suggestions.push(p.distributor);
                }
            }
        });

        if (suggestions.length === 0) { box.style.display = 'none'; return; }

        box.innerHTML = '';
        suggestions.slice(0, 8).forEach((dist) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `<strong>${dist}</strong>`;
            
            div.addEventListener('click', () => {
                input.value = dist;
                box.style.display = 'none';
            });
            box.appendChild(div);
        });
        box.style.display = 'block';
    });

    input.addEventListener('keydown', (e) => {
        const items = box.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % items.length;
            items.forEach((item, i) => item.classList.toggle('active-suggestion', i === activeIndex));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + items.length) % items.length;
            items.forEach((item, i) => item.classList.toggle('active-suggestion', i === activeIndex));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && items[activeIndex]) {
                items[activeIndex].click();
            }
            box.style.display = 'none';
        } else if (e.key === 'Escape') {
            box.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !box.contains(e.target)) box.style.display = 'none';
    });
}

function setupTechnicalSearch() {
    const input = document.getElementById('dTech');
    const box = document.getElementById('dTechSuggestions');
    let activeIndex = -1;

    input.addEventListener('input', function() {
        const term = this.value.trim().toLowerCase();
        if (term.length < 1) { box.style.display = 'none'; return; }
        
        const suggestions = [];
        const seen = new Set();
        
        allProducts.forEach(p => {
            if (p.technical && p.technical.toLowerCase().includes(term)) {
                const key = p.technical.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    suggestions.push(p);
                }
            }
        });

        if (suggestions.length === 0) { box.style.display = 'none'; return; }

        box.innerHTML = '';
        suggestions.slice(0, 8).forEach((prod) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `<strong>${prod.technical}</strong><small>${prod.name || ''} | ${prod.company || ''}</small>`;
            
            div.addEventListener('click', () => {
                input.value = prod.technical;
                autoFillDoseDetailsOnly(prod);
                box.style.display = 'none';
            });
            box.appendChild(div);
        });
        box.style.display = 'block';
    });

    input.addEventListener('keydown', (e) => {
        const items = box.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % items.length;
            items.forEach((item, i) => item.classList.toggle('active-suggestion', i === activeIndex));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + items.length) % items.length;
            items.forEach((item, i) => item.classList.toggle('active-suggestion', i === activeIndex));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && items[activeIndex]) {
                items[activeIndex].click();
            }
            box.style.display = 'none';
        } else if (e.key === 'Escape') {
            box.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !box.contains(e.target)) box.style.display = 'none';
    });
}

// ==========================================
// Initialize
// ==========================================
window.onload = async function() {
    await loadData();
    
    setupProductNameSearch();
    setupCompanySearch();
    setupDistributorSearch();
    setupTechnicalSearch();
    
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            document.getElementById('header').classList.add('fade-up', 'header-animate');
            document.getElementById('statsGrid').classList.add('fade-up', 'stats-animate');
            document.getElementById('formSection').classList.add('fade-up', 'form-animate');
            document.getElementById('search').classList.add('fade-up', 'search-animate');
            document.getElementById('tableWrapper').classList.add('fade-up', 'table-animate');
        }, 500);
    }
};