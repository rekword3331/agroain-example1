// ==========================================
// Firebase Config
// ==========================================
const firebaseConfig = {
    databaseURL: "https://agroain-default-rtdb.firebaseio.com/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==========================================
// Crop Name Mapping (English value ↔ Hindi display)
// ==========================================
const cropMap = {
    'soyabean': 'सोयाबीन',
    'maize': 'मक्का',
    'wheat': 'गेहूं',
    'garlic': 'लहसुन',
    'onion': 'प्याज',
    'potato': 'आलू',
    'paddy': 'धान',
    'sugarcane': 'गन्ना',
    'cotton': 'कपास',
    'groundnut': 'मूंगफली',
    'mustard': 'सरसों',
    'chickpea': 'चना',
    'pea': 'मटर',
    'lentil': 'मसूर',
    'barley': 'जौ',
    'sorghum': 'ज्वार',
    'millet': 'बाजरा',
    'sesame': 'तिल',
    'sunflower': 'सूरजमुखी',
    'pigeonpea': 'अरहर'
};

const cropAliases = {
    'lentil': ['masoor', 'मसूर', 'masur'],
    'paddy': ['rice', 'dhan', 'धान', 'chawal'],
    'wheat': ['gehu', 'गेहूं'],
    'pigeonpea': ['arhar', 'tur', 'tuar', 'अरहर', 'तुअर'],
    'chickpea': ['chana', 'gram', 'चना'],
    'mustard': ['sarson', 'सरसों', 'rai'],
    'groundnut': ['mungfali', 'peanut', 'मूंगफली'],
    'sugarcane': ['ganna', 'गन्ना'],
    'cotton': ['kapas', 'कपास']
};

function getCropHindiName(englishValue) {
    return cropMap[englishValue] || englishValue;
}

function normalizeCropName(name) {
    if (!name) return '';
    const lower = name.toLowerCase().trim();
    if (cropMap[lower]) return lower;
    for (let [eng, hindi] of Object.entries(cropMap)) {
        if (hindi.toLowerCase() === lower) return eng;
    }
    for (let [eng, aliases] of Object.entries(cropAliases)) {
        if (aliases.some(alias => alias.toLowerCase() === lower)) return eng;
    }
    for (let [eng, aliases] of Object.entries(cropAliases)) {
        if (aliases.some(alias => lower.includes(alias) || alias.includes(lower))) return eng;
    }
    for (let [eng, hindi] of Object.entries(cropMap)) {
        if (eng.includes(lower) || lower.includes(eng)) return eng;
        if (hindi.toLowerCase().includes(lower) || lower.includes(hindi.toLowerCase())) return eng;
    }
    return name;
}

// ==========================================
// Global Variables
// ==========================================
let allProducts = [];
let allPackages = [];
let filteredProducts = [];
let filteredPackages = [];
let currentProductPage = 1;
let currentPackagePage = 1;
let isSearching = false;
const itemsPerPage = 5;
let currentCrop = '';
let currentCropHindi = '';
let currentBigha = 1;
let currentSearchMode = ''; // 'day', 'name', 'technical'

// ==========================================
// Page Load Handler
// ==========================================
window.onload = async () => {
    const loader = document.getElementById('pageLoader');
    const mainContainer = document.getElementById('mainContainer');
    
    try {
        await Promise.all([loadInventory(), loadPackages()]);
        if (loader) loader.classList.add('hidden');
        if (mainContainer) mainContainer.classList.add('visible');
        toggleBuwaiOptions();
        setupSearchSuggestions();
    } catch (error) {
        console.error("Error loading page:", error);
        if (loader) loader.classList.add('hidden');
        if (mainContainer) mainContainer.classList.add('visible');
        alert("कुछ गड़बड़ हो गई। कृपया पेज को रिफ्रेश करें।");
    }
};

// ==========================================
// Data Loading Functions
// ==========================================
async function loadInventory() {
    try {
        const snapshot = await db.ref('inventory').once('value');
        const data = snapshot.val();
        if (data) {
            allProducts = [];
            for (let key in data) {
                if (data.hasOwnProperty(key)) {
                    let p = data[key];
                    if (p.cat === 'dawai') {
                        p.id = key;
                        allProducts.push(p);
                    }
                }
            }
        }
        console.log(`✅ Loaded ${allProducts.length} products`);
        return true;
    } catch (err) {
        console.error("Error loading inventory:", err);
        throw err;
    }
}

async function loadPackages() {
    try {
        const snapshot = await db.ref('packages').once('value');
        const data = snapshot.val();
        if (data) {
            allPackages = [];
            for (let key in data) {
                if (data.hasOwnProperty(key)) {
                    let pkg = data[key];
                    pkg.id = key;
                    allPackages.push(pkg);
                }
            }
        }
        console.log(`✅ Loaded ${allPackages.length} packages`);
        return true;
    } catch (err) {
        console.error("Error loading packages:", err);
        throw err;
    }
}

function setupSearchSuggestions() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    let suggestionsDiv = document.getElementById('searchSuggestions');
    if (!suggestionsDiv) {
        suggestionsDiv = document.createElement('div');
        suggestionsDiv.id = 'searchSuggestions';
        suggestionsDiv.className = 'search-suggestions';
        searchInput.parentNode.appendChild(suggestionsDiv);
    }
    
    searchInput.addEventListener('input', function() {
        const val = this.value.trim().toLowerCase();
        if (!val || val.length < 1) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        const suggestions = new Set();
        allProducts.forEach(p => {
            if (p.name && p.name.toLowerCase().includes(val)) {
                suggestions.add(p.name);
            }
            if (p.technical && p.technical.toLowerCase().includes(val)) {
                suggestions.add(p.technical);
            }
        });
        
        const suggestionArray = Array.from(suggestions).slice(0, 8);
        
        if (suggestionArray.length > 0) {
            let html = '';
            suggestionArray.forEach(s => {
                html += `<div class="suggestion-item" onclick="selectSuggestion('${escapeHtml(s).replace(/'/g, "\\'")}')">${escapeHtml(s)}</div>`;
            });
            suggestionsDiv.innerHTML = html;
            suggestionsDiv.style.display = 'block';
        } else {
            suggestionsDiv.style.display = 'none';
        }
    });
    
    document.addEventListener('click', function(e) {
        if (e.target !== searchInput) {
            suggestionsDiv.style.display = 'none';
        }
    });
}

function selectSuggestion(text) {
    const searchInput = document.getElementById('searchInput');
    const suggestionsDiv = document.getElementById('searchSuggestions');
    if (searchInput) searchInput.value = text;
    if (suggestionsDiv) suggestionsDiv.style.display = 'none';
}

// ==========================================
// Crop Matching Helper
// ==========================================
function doesCropMatch(pkgCrop, searchCrop) {
    if (!pkgCrop || !searchCrop) return false;
    const normalizedPkg = normalizeCropName(pkgCrop);
    const normalizedSearch = normalizeCropName(searchCrop);
    if (normalizedPkg === normalizedSearch) return true;
    const pkgLower = pkgCrop.toLowerCase().trim();
    const searchLower = searchCrop.toLowerCase().trim();
    if (cropAliases[normalizedSearch]) {
        if (cropAliases[normalizedSearch].some(alias => pkgLower.includes(alias))) return true;
    }
    if (cropAliases[normalizedPkg]) {
        if (cropAliases[normalizedPkg].some(alias => searchLower.includes(alias))) return true;
    }
    if (pkgLower.includes(searchLower) || searchLower.includes(pkgLower)) return true;
    return false;
}

// ==========================================
// Dose Calculation
// ==========================================
// ==========================================
// 1. Dose Calculation Function
// ==========================================
function getDosePerBigha(doseSprayText) {
    // अगर डोज़ खाली है या डैश है, तो 0 वापस करो
    if (!doseSprayText || doseSprayText === "—") return 0;

    // स्मार्ट Regex: यह 'biga', 'bigha', 'per', 'par' और एक्स्ट्रा स्पेस सबको संभाल लेगा
    const regex = /(\d+)\s*(ml|g|gm)\s*\/\s*(?:per|par)?\s*(?:bigha|biga)/i;
    const match = doseSprayText.match(regex);

    // अगर परफेक्ट मैच मिल जाता है (जैसे 100ml/par biga)
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }

    // बैकअप तरीका: अगर ऊपर का नियम फेल हो जाए, तो टेक्स्ट में से जो भी पहला नंबर मिले उसे निकाल लो
    const fallbackMatch = doseSprayText.match(/(\d+)/);
    if (fallbackMatch && fallbackMatch[1]) {
        return parseInt(fallbackMatch[1], 10);
    }

    return 0;
}


function normalizeTechnicalName(tech) {
    if (!tech) return '';
    return tech.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ==========================================
// Pack Grouping & Calculation
// ==========================================
function groupProducts(products) {
    const groups = new Map();
    products.forEach(p => {
        const nameKey = (p.name || '').trim().toLowerCase();
        const companyKey = (p.company || '').trim().toLowerCase();
        const key = nameKey + '||' + companyKey;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(p);
    });
    return Array.from(groups.values());
}

function calculateOptimalCombination(totalRequired, packs) {
    if (!packs.length || totalRequired <= 0) return { combo: [], totalPrice: 0 };
    packs.sort((a, b) => b.size - a.size);
    let remaining = totalRequired;
    let combo = [];
    let totalPrice = 0;
    for (let pack of packs) {
        if (remaining <= 0) break;
        const count = Math.floor(remaining / pack.size);
        if (count > 0) {
            combo.push({ ...pack, count });
            totalPrice += count * pack.price;
            remaining -= count * pack.size;
        }
    }
    if (remaining > 0) {
        let smallestPack = packs[packs.length-1];
        let bestPack = null;
        for (let pack of packs) {
            if (pack.size >= remaining) {
                if (!bestPack || pack.price < bestPack.price) bestPack = pack;
            }
        }
        if (bestPack) {
            combo.push({ ...bestPack, count: 1 });
            totalPrice += bestPack.price;
        } else {
            combo.push({ ...smallestPack, count: 1 });
            totalPrice += smallestPack.price;
        }
    }
    return { combo, totalPrice };
}

// ==========================================
// Card Rendering Functions
// ==========================================
function renderPackageCard(pkg, bigha) {
    const name = pkg.name || 'पैलेज';
    const price = pkg.price || 0;
    const details = pkg.details || pkg.extraDetails || '—';
    const img = pkg.img || 'https://via.placeholder.com/150?text=No+Image';
    const doseInfo = pkg.dosePerBigha ? `डोज़: ${pkg.dosePerBigha}` : '';
    const safeName = escapeHtml(name).replace(/'/g, "\\'");

    return `
        <div class="package-card">
            <div class="med-content-wrapper">
                <div class="med-left">
                    <img src="${img}" class="med-photo zoomable" onclick="openZoom(this.src)" onerror="this.src='https://via.placeholder.com/150?text=Agroain'" alt="${safeName}">
                </div>
                <div class="med-right">
                    <h4 class="med-name">${escapeHtml(name)}</h4>
                    <p><strong>💰 कीमत:</strong> ₹${price}</p>
                    ${doseInfo ? `<p><strong>💧 ${doseInfo}</strong></p>` : ''}
                    <p>📋 ${escapeHtml(details)}</p>
                </div>
            </div>
            <button class="buy-btn" onclick="handleBuyNow('${safeName}', '₹${price}')">
                <i class="fa-solid fa-cart-shopping"></i> अभी खरीदें
            </button>
        </div>
    `;
}

// ==========================================
// 2. Card Rendering Function
// ==========================================
// ==========================================
// 2. Card Rendering Function (Fix for pure number packSize)
// ==========================================
function renderProductCardWithPacks(docData, totalBigha) {
    // 1. पहले फंक्शन को कॉल करके 1 बीघा की डोज़ निकाली
    const dosePerBigha = getDosePerBigha(docData.doseSpray);
    
    // 2. 15 बीघा के लिए कुल कितनी दवा चाहिए (ml या g में) उसका हिसाब लगाया
    const totalRequiredDose = dosePerBigha * totalBigha; 

    // शुरुआती वैल्यू (Default Values)
    let doseDisplay = "💧 —";
    let packingDetails = "पैकिंग जानकारी उपलब्ध नहीं";
    let totalPriceDisplay = "0.00";

    // 3. अगर डोज़ और जमीन का हिसाब सही है, तो असली कैलकुलेशन शुरू करो
    if (dosePerBigha > 0 && totalRequiredDose > 0) {
        // स्क्रीन पर दिखने वाला डोज़ टेक्स्ट
        doseDisplay = `💧 ${dosePerBigha} ml या g / बीघा (कुल जरूरत: ${totalRequiredDose} ml/g)`;
        
        // --- यहाँ से पैकेट्स का असली और पूरा लॉजिक शुरू होता है ---
        let availablePacks = [];

        // चेक करें कि क्या डेटाबेस में 'packs' नाम का ऐरे (Array) है या सिंगल पैक की जानकारी है
        if (docData.packs && Array.isArray(docData.packs) && docData.packs.length > 0) {
            // अगर एक से ज्यादा पैकिंग उपलब्ध हैं (जैसे Tanaka में 500ml और 250ml दोनों)
            availablePacks = docData.packs.map(p => ({
                size: parseInt(p.size, 10) || parseInt(p.packSize, 10),
                price: parseFloat(p.price)
            })).sort((a, b) => b.size - a.size); // बड़े पैकेट्स को पहले रखेंगे
        } else if (docData.packSize && docData.price) {
            // अगर सिर्फ एक ही पैकिंग की जानकारी है (जैसे Profex Super में सिर्फ 100ml है)
            availablePacks = [{
                size: parseInt(docData.packSize, 10),
                price: parseFloat(docData.price)
            }];
        }

        // अगर हमें पैकेट्स की जानकारी मिल जाती है, तो सबसे बेस्ट कॉम्बination ढूंढो
        if (availablePacks.length > 0) {
            let remainingDose = totalRequiredDose;
            let selectedPacks = {};
            let calculatedTotalPrice = 0;

            // बड़े पैकेट से छोटे पैकेट की तरफ बढ़ते हुए हिसाब लगाना
            for (let pack of availablePacks) {
                if (pack.size <= 0) continue;
                
                // इस साइज के कितने पैकेट पूरे-पूरे लग रहे हैं
                let count = Math.floor(remainingDose / pack.size);
                if (count > 0) {
                    selectedPacks[pack.size + (docData.packSize.includes('ml') ? 'ml' : 'g')] = count;
                    calculatedTotalPrice += count * pack.price;
                    remainingDose -= count * pack.size;
                }
            }

            // अगर पूरी डोज़ खत्म होने के बाद भी कुछ दवा (जैसे 50ml या 100ml) बच जाती है, 
            // तो सबसे छोटा उपलब्ध पैकेट एक और जोड़ लो ताकि दवा कम न पड़े
            if (remainingDose > 0) {
                let smallestPack = availablePacks[availablePacks.length - 1];
                let packKey = smallestPack.size + (docData.packSize.includes('ml') ? 'ml' : 'g');
                selectedPacks[packKey] = (selectedPacks[packKey] || 0) + 1;
                calculatedTotalPrice += smallestPack.price;
            }

            // चुनी गई पैकिंग का सुंदर टेक्स्ट बनाओ (जैसे: 500ml x 2, 250ml x 1)
            packingDetails = Object.entries(selectedPacks)
                .map(([size, count]) => `${size} के ${count} पैकेट`)
                .join(", ");
                
            totalPriceDisplay = calculatedTotalPrice.toFixed(2);
        }
    }

    // 4. HTML स्क्रीन के एलिमेंट्स को आईडी के हिसाब से अपडेट करना
    const safeId = docData.name.replace(/\s+/g, '-');
    
    const doseElement = document.getElementById(`dose-${safeId}`);
    const packElement = document.getElementById(`pack-${safeId}`);
    const priceElement = document.getElementById(`price-${safeId}`);

    if (doseElement) doseElement.innerText = doseDisplay;
    if (packElement) packElement.innerText = packingDetails;
    if (priceElement) priceElement.innerText = `कुल दवा मूल्य: ₹${totalPriceDisplay}`;
}




function showPackAlert(productName, price, hasSmallPack) {
    if (hasSmallPack) {
        alert(`⚠️ "${productName}" के लिए छोटी पैकिंग का उपयोग हुआ है।\nकुल: ₹${price.toFixed(2)}`);
    } else {
        alert(`💰 "${productName}" की कुल दवा कीमत: ₹${price.toFixed(2)}`);
    }
}

// ==========================================
// Main Content Renderer (Unified - No Tabs)
// ==========================================
function renderUnifiedContent() {
    const resultDiv = document.getElementById('result');
    const grandTotalContainer = document.getElementById('grandTotalContainer');
    if (!resultDiv) return;

    resultDiv.innerHTML = '';

    let unifiedContent = document.createElement('div');
    unifiedContent.id = 'unifiedContent';
    resultDiv.appendChild(unifiedContent);

    let html = '';
    window._cardPrices = [];

    if (currentSearchMode === 'day') {
        if (filteredPackages.length > 0) {
            const start = (currentPackagePage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = filteredPackages.slice(start, end);

            if (window._cropStagesHTML) {
                html += window._cropStagesHTML;
            }

            pageItems.forEach(pkg => {
                html += renderPackageCard(pkg, currentBigha);
            });

            html += renderPaginationHTML(filteredPackages.length, currentPackagePage, itemsPerPage, 'goToPackagePage');
        } else {
            if (window._cropStagesHTML) {
                html += window._cropStagesHTML;
            }
            html += "<p class='no-results'>😕 इस फसल और दिन के लिए कोई पैकेज नहीं मिला।</p>";
        }
    } 
    else if (currentSearchMode === 'name' || currentSearchMode === 'technical') {
        if (filteredProducts.length > 0) {
            let groups = groupProducts(filteredProducts);

            if (currentSearchMode === 'technical') {
                groups = groups.slice(0, 10);
            }

            const ITEMS_PER_PAGE = 1;
            const totalGroups = groups.length;
            const totalPages = Math.ceil(totalGroups / ITEMS_PER_PAGE);
            if (currentProductPage > totalPages) currentProductPage = 1;
            
            const start = (currentProductPage - 1) * ITEMS_PER_PAGE;
            const end = Math.min(start + ITEMS_PER_PAGE, totalGroups);
            const pageGroups = groups.slice(start, end);

            html += renderPaginationHTML(totalGroups, currentProductPage, ITEMS_PER_PAGE, 'goToProductPage');

            pageGroups.forEach(group => {
                html += renderProductCardWithPacks(group, currentBigha);
            });

            const allGrandTotal = window._cardPrices.reduce((sum, price) => sum + price, 0);

            if (currentSearchMode === 'name' && allGrandTotal > 0 && grandTotalContainer) {
                grandTotalContainer.innerHTML = `
                    <div class="grand-total-card">
                        <h3>🛒 सभी दवाइयों का कुल</h3>
                        <div class="final-amount">₹${allGrandTotal.toFixed(2)}</div>
                        <button class="grand-buy-btn" onclick="handleBuyNow('सभी दवाइयाँ', '₹${allGrandTotal.toFixed(2)}')">
                            <i class="fa-solid fa-cart-shopping"></i> अभी सभी खरीदें
                        </button>
                    </div>
                `;
                grandTotalContainer.style.display = 'block';
            } else if (grandTotalContainer) {
                grandTotalContainer.style.display = 'none';
            }
        } else {
            html = "<p class='no-results'>😕 कोई दवाई नहीं मिली।</p>";
            if (grandTotalContainer) grandTotalContainer.style.display = 'none';
        }
    }

    unifiedContent.innerHTML = html;
}

function renderPaginationHTML(totalItems, currentPage, itemsPerPage, goToPageFunction) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return '';
    
    let btns = `<div style="display:flex; flex-direction:row; justify-content:center; gap:8px; flex-wrap:nowrap; margin:10px 0;">`;
    for (let i = 1; i <= totalPages; i++) {
        btns += `<button 
            style="background-color: var(--primary, #4CAF50); color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 1rem; min-width: 45px; ${i === currentPage ? 'opacity: 0.6; pointer-events: none;' : ''}"
            onclick="${goToPageFunction}(${i})"
            ${i === currentPage ? 'disabled' : ''}>${i}</button>`;
    }
    btns += `</div>`;
    return btns;
}

// ==========================================
// Page Navigation
// ==========================================
function goToProductPage(page) {
    currentProductPage = page;
    renderUnifiedContent();
    document.getElementById('unifiedContent')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// वैंकल्पिक नाम सुधारा गया
function goToPackagePage(page) {
    currentPackagePage = page;
    renderUnifiedContent();
    document.getElementById('unifiedContent')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// Search Handler
// ==========================================
async function handleSmartSearch() {
    const yesRadio = document.querySelector('input[name="buwai"][value="yes"]');
    if (yesRadio && yesRadio.checked) {
        await handleSownCase();
    } else {
        await handleNotSownCase();
    }
}

async function handleSownCase() {
    if (isSearching) return;
    
    isSearching = true;
    const searchBtn = document.querySelector('.section button') || document.querySelector('button[onclick*="handleSmartSearch"]');
    const originalBtnText = searchBtn ? searchBtn.innerHTML : 'खोजें';
    
    if (searchBtn) {
        searchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-pulse"></i> खोज रहे हैं...';
        searchBtn.disabled = true;
    }
    
    try {
        const bighaInput = document.getElementById('bigha');
        const cropSelect = document.getElementById('cropSelect');
        const searchInput = document.getElementById('searchInput');
        const resTitle = document.getElementById('resTitle');
        const resultDiv = document.getElementById('result');
        const grandTotalContainer = document.getElementById('grandTotalContainer');

        currentBigha = bighaInput ? (parseFloat(bighaInput.value) || 1) : 1;
        currentCrop = cropSelect ? cropSelect.value : '';
        currentCropHindi = getCropHindiName(currentCrop);
        
        const inputVal = searchInput ? searchInput.value.trim() : '';
        
        if (resultDiv) resultDiv.style.display = "block";
        if (grandTotalContainer) grandTotalContainer.innerHTML = '';
        
        const oldUnified = document.getElementById('unifiedContent');
        if (oldUnified) oldUnified.remove();

        if (!inputVal) {
            if (resultDiv) resultDiv.innerHTML = "<div class='success-box'>⚠️ कृपया दिन या दवाई का नाम लिखें।</div>";
            isSearching = false;
            if (searchBtn) { searchBtn.innerHTML = originalBtnText; searchBtn.disabled = false; }
            return;
        }

        const isDay = !isNaN(inputVal) && inputVal !== "";
        
        if (isDay) {
            const day = parseInt(inputVal);
            currentSearchMode = 'day';
            if (resTitle) resTitle.innerText = `🌾 अवस्था: ${day} दिन (${currentCropHindi})`;
            
            await loadCropStagesAdvice(day);
            
            filteredPackages = allPackages.filter(pkg => {
                const cropMatch = doesCropMatch(pkg.crop, currentCrop);
                const ageMatch = day >= (pkg.ageMin || 0) && day <= (pkg.ageMax || 999);
                const typeMatch = !((pkg.packageType || '').includes('पहले') && day > 0);
                return cropMatch && ageMatch && typeMatch;
            });
            
            filteredProducts = [];
            currentPackagePage = 1;
        } 
        else {
            const searchLower = inputVal.toLowerCase();
            
            filteredProducts = allProducts.filter(p => 
                p.name?.toLowerCase().includes(searchLower)
            );
            
            if (filteredProducts.length > 0) {
                currentSearchMode = 'name';
                if (resTitle) resTitle.innerText = `🔎 परिणाम: "${inputVal}"`;
                filteredPackages = [];
            } else {
                currentSearchMode = 'technical';
                if (resTitle) resTitle.innerText = `⚠️ "${inputVal}" नाम की कोई दवाई नहीं मिली। तकनीकी नाम से खोज रहे हैं...`;
                
                const normalizedSearch = normalizeTechnicalName(inputVal);
                filteredProducts = allProducts.filter(p => 
                    normalizeTechnicalName(p.technical).includes(normalizedSearch)
                );
                
                if (filteredProducts.length === 0) {
                    if (resultDiv) {
                        resultDiv.innerHTML = `
                        <div class='success-box'>
                            ⚠️ माफ़ करें, "${escapeHtml(inputVal)}" से मिलती-जुलती कोई दवाई या तकनीकी नाम हमारे डेटाबेस में नहीं है।<br>
                            कृपया कोई और तकनीकी नाम लिखकर खोजें।
                        </div>`;
                    }
                    if (searchInput) searchInput.value = '';
                    filteredPackages = [];
                    isSearching = false;
                    if (searchBtn) { searchBtn.innerHTML = originalBtnText; searchBtn.disabled = false; }
                    return;
                }
                filteredPackages = [];
            }
            currentProductPage = 1;
        }
        
        renderUnifiedContent();

    } catch (err) {
        console.error("Search error:", err);
        const resultDiv = document.getElementById('result');
        if (resultDiv) resultDiv.innerHTML = "<div class='success-box'>⚠️ सर्वर से कनेक्ट नहीं हो पाए।</div>";
    } finally {
        if (searchBtn) {
            searchBtn.innerHTML = originalBtnText;
            searchBtn.disabled = false;
        }
        isSearching = false;
    }
}

async function loadCropStagesAdvice(day) {
    try {
        const snapshot = await db.ref('crop_stages').once('value');
        let stagesHtml = "";
        let stageFound = false;

        snapshot.forEach(child => {
            const stage = child.val();
            if (stage.crop && doesCropMatch(stage.crop, currentCrop) && day >= stage.start && day <= stage.end) {
                stagesHtml += `
                    <div class="success-box crop-stage-advice">
                        <h3 style="margin-top:0; color:var(--dark, #333);"><i class="fa-solid fa-leaf"></i> ${escapeHtml(stage.title)}</h3>
                        <p>${escapeHtml(stage.msg)}</p>
                        ${stage.alert ? `<div class="alert-info">⚠️ ${escapeHtml(stage.alert)}</div>` : ''}
                    </div>`;
                stageFound = true;
            }
        });

        if (!stageFound) {
            stagesHtml = `<div class='success-box crop-stage-advice'>ℹ️ ${currentCropHindi} के ${day} दिन के लिए सामान्य देखरेख जारी रखें।</div>`;
        }
        
        window._cropStagesHTML = stagesHtml;
        
    } catch (e) {
        console.error("Stages load error:", e);
        window._cropStagesHTML = "<div class='success-box'>⚠️ फसल अवस्था जानकारी लोड नहीं हो पाई।</div>";
    }
}

async function handleNotSownCase() {
    const preOptionOpt = document.getElementById('selectedPreOption');
    const preOption = preOptionOpt ? preOptionOpt.value : '';
    const crop = document.getElementById('cropSelect')?.value || '';
    const bigha = document.getElementById('bigha')?.value || 1;
    
    if (preOption === 'seed') {
        window.location.href = `seed_treatment.html?crop=${encodeURIComponent(crop)}&bigha=${bigha}`;
    } else if (preOption === 'presowing') {
        window.location.href = `buwaikephele.html?crop=${encodeURIComponent(crop)}&bigha=${bigha}`;
    }
}

// ==========================================
// UI Toggle Functions
// ==========================================
function toggleBuwaiOptions() {
    const yesRadio = document.querySelector('input[name="buwai"][value="yes"]');
    const yesContainer = document.getElementById('yesContainer');
    const noContainer = document.getElementById('noContainer');
    
    if (!yesContainer || !noContainer) return;

    if (yesRadio && yesRadio.checked) {
        yesContainer.classList.remove('hidden');
        noContainer.classList.add('hidden');
    } else {
        yesContainer.classList.add('hidden');
        noContainer.classList.remove('hidden');
    }
}

function selectPreOption(option) {
    const seedBtn = document.getElementById('seedTreatmentBtn');
    const preBtn = document.getElementById('preSowingBtn');
    const hiddenInput = document.getElementById('selectedPreOption');
    
    if (!hiddenInput) return;

    if (option === 'seed') {
        if (seedBtn) seedBtn.classList.add('selected');
        if (preBtn) preBtn.classList.remove('selected');
        hiddenInput.value = 'seed';
    } else {
        if (seedBtn) seedBtn.classList.remove('selected');
        if (preBtn) preBtn.classList.add('selected');
        hiddenInput.value = 'presowing';
    }
}

// ==========================================
// Utility Functions
// ==========================================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function handleBuyNow(productName, price) {
    alert(`✅ "${productName}" खरीदने के लिए चुना गया।\n💰 कीमत: ${price}\n(जल्द ही ऑनलाइन भुगतान सुविधा उपलब्ध हगी।)`);
}

function openZoom(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    if (modal && modalImg) {
        modal.style.display = "flex";
        modalImg.src = src;
    }
}

function closeZoom() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = "none";
    }
}
        