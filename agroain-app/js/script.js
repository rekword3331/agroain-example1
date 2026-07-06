// ==========================================
// Firebase Config & Initialization
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAOQp4Ez6omxSL5MDh_cGzzUy1gcf4KkEo",
  authDomain: "agroain.firebaseapp.com",
  databaseURL: "https://agroain-default-rtdb.firebaseio.com",
  projectId: "agroain",
  storageBucket: "agroain.firebasestorage.app",
  messagingSenderId: "837977852518",
  appId: "1:837977852518:web:eebd9baaec310f03e0bba7",
  measurementId: "G-J7CG2Z0TMG"
};

let db;

try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.database(); 
        console.log("✅ Firebase SDK Loaded");
    } else {
        alert("❌ भईया, index.html में Firebase की स्क्रिप्ट लोड नहीं हो पा रही है! इंटरनेट या स्क्रिप्ट टैग चेक करें।");
    }
} catch (e) {
    alert("❌ Firebase सेटअप में दिक्कत: " + e.message);
}

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
        if (!db) {
            throw new Error("डेटाबेस कनेक्शन उपलब्ध नहीं है।");
        }
        await Promise.all([loadInventory(), loadPackages()]);
        if (loader) loader.classList.add('hidden');
        if (mainContainer) mainContainer.classList.add('visible');
        toggleBuwaiOptions();
        setupSearchSuggestions();
    } catch (error) {
        console.error("Error loading page:", error);
        if (loader) loader.classList.add('hidden');
        if (mainContainer) mainContainer.classList.add('visible');
        alert("डेटा लोड करने में समस्या आई। कृपया पेज रिफ्रेश करें।");
    }
};

// ==========================================
// Data Loading Functions
// ==========================================
async function loadInventory() {
    try {
        const snapshot = await db.ref('inventory').once('value');
        const data = snapshot.val();
        allProducts = []; 
        if (data) {
            for (let key in data) {
                if (data.hasOwnProperty(key)) {
                    let p = data[key];
                    if (p) {
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
function getDosePerBigha(doseSprayText) {
    if (!doseSprayText || doseSprayText === "—") return 0;
    const regex = /(\d+)\s*(ml|g|gm)\s*\/\s*(?:per|par)?\s*(?:bigha|biga)/i;
    const match = doseSprayText.match(regex);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
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

function calculateOptimalCombination(totalRequired, currentProduct) {
    if (!totalRequired || totalRequired <= 0) return { combo: [], totalPrice: 0 };

    let availablePacks = [];
    const currentTech = currentProduct.technical ? normalizeTechnicalName(currentProduct.technical) : '';

    allProducts.forEach(p => {
        if (!p.technical) return;
        if (normalizeTechnicalName(p.technical) === currentTech) {
            let pSizeRaw = (p.packSize || p.packing || '').toString().toLowerCase();
            let sizeNum = 0;
            const match = pSizeRaw.match(/(\d+(\.\d+)?)/);
            if (match) {
                sizeNum = parseFloat(match[1]);
                if (pSizeRaw.includes('l') && !pSizeRaw.includes('ml')) {
                    sizeNum = sizeNum * 1000;
                }
            }
            if (sizeNum > 0) {
                availablePacks.push({
                    name: p.name || 'दवाई',
                    size: sizeNum,
                    price: parseFloat(p.price) || 0,
                    isTargetBrand: (p.name && currentProduct.name && p.name.trim().toLowerCase() === currentProduct.name.trim().toLowerCase())
                });
            }
        }
    });

    if (availablePacks.length === 0) return { combo: [], totalPrice: 0 };

    availablePacks.sort((a, b) => b.size - a.size);

    let remaining = totalRequired;
    let rawCombo = [];
    let totalPrice = 0;

    for (let pack of availablePacks) {
        if (remaining <= 0) break;
        if (!pack.isTargetBrand) continue;
        let count = Math.floor(remaining / pack.size);
        if (count > 0) {
            rawCombo.push({ ...pack, count });
            totalPrice += count * pack.price;
            remaining -= count * pack.size;
        }
    }

    if (remaining > 0) {
        let suitablePacks = availablePacks.filter(p => p.isTargetBrand && p.size >= remaining);
        if (suitablePacks.length === 0) {
            suitablePacks = availablePacks.filter(p => p.size >= remaining);
        }
        if (suitablePacks.length === 0) {
            suitablePacks = availablePacks.filter(p => p.isTargetBrand);
            if (suitablePacks.length === 0) suitablePacks = availablePacks;
        }
        if (suitablePacks.length > 0) {
            let bestPack = suitablePacks.reduce((min, p) => p.size < min.size ? p : min);
            rawCombo.push({ ...bestPack, count: 1 });
            totalPrice += bestPack.price;
        }
    }

    // समान साइज़ वाली एंट्री को मर्ज करें
    const mergedMap = new Map();
    rawCombo.forEach(entry => {
        const key = entry.size + '||' + entry.name;
        if (mergedMap.has(key)) {
            let existing = mergedMap.get(key);
            existing.count += entry.count;
            existing.price += entry.price * entry.count;
        } else {
            mergedMap.set(key, { ...entry });
        }
    });
    const combo = Array.from(mergedMap.values());

    return { combo, totalPrice };
}

// ==========================================
// Card Rendering Functions
// ==========================================
function renderPackageCard(pkg, bighaInput) {
    const bigha = parseFloat(bighaInput) || 1;
    const name = pkg.name || pkg.company || 'स्मार्ट सुरक्षा पैकेज';
    const safeName = escapeHtml(name).replace(/'/g, "\\'");

    let itemsHtml = '';
    let packageTotalPrice = 0; 

    if (pkg.items && Array.isArray(pkg.items)) {
        itemsHtml = `<div class="package-items-container" style="margin-top: 12px; border-top: 1px dashed #ccc; padding-top: 10px;">
            <h5 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 1rem;"><i class="fa-solid fa-flask"></i> पैकेज में शामिल दवाइयाँ (${bigha} बीघा खेत के लिए):</h5>`;
        
        pkg.items.forEach((item, index) => {
            const itemImg = item.img || 'https://via.placeholder.com/150?text=Agroain';
            const currentProdName = (item.prodName || item.name || '').trim();
            
            const rawDose = item.dose || '';
            const doseMatch = rawDose.match(/(\d+(\.\d+)?)/);
            const dosePerBigha = doseMatch ? parseFloat(doseMatch[1]) : 0;
            const totalDoseNeeded = dosePerBigha * bigha; 

            // --- यूनिट डिटेक्शन फिक्स (gm/ml) ---
            let unitStr = 'ml';
            const rawDoseLower = rawDose.toLowerCase();
            const isGmByDose = rawDoseLower.includes('gm') || rawDoseLower.includes('ग्राम');
            const matchedProduct = allProducts.find(p => 
                p.name && p.name.trim().toLowerCase() === currentProdName.toLowerCase()
            );
            if (matchedProduct) {
                const pSizeLower = (matchedProduct.packSize || '').toLowerCase();
                const pTechLower = (matchedProduct.technical || '').toLowerCase();
                if (isGmByDose || 
                    pSizeLower.includes('gm') || pSizeLower.includes('g') || pSizeLower.includes('ग्राम') ||
                    pTechLower.includes('wp') || pTechLower.includes('wg') || pTechLower.includes('df') || pTechLower.includes('sg')) {
                    unitStr = 'gm';
                }
            }
            const isGm = unitStr === 'gm';
            // --------------------------------

            let finalPrice = (parseFloat(item.price) || 0) * bigha;
            let finalPackageSuggestion = item.packing || '—';

            if (allProducts && Array.isArray(allProducts) && currentProdName && totalDoseNeeded > 0) {
                if (matchedProduct) {
                    const comboResult = calculateOptimalCombination(totalDoseNeeded, {
                        name: matchedProduct.name,
                        technical: matchedProduct.technical
                    });
                    if (comboResult.combo && comboResult.combo.length > 0) {
                        finalPrice = comboResult.totalPrice;
                        finalPackageSuggestion = comboResult.combo
                            .map(c => `${c.size} ${unitStr} के ${c.count} पैकेट`)
                            .join(' + ');
                    }
                }
            }

            packageTotalPrice += finalPrice;

            let totalDoseDisplay = '';
            if (totalDoseNeeded > 0) {
                if (!isGm && totalDoseNeeded >= 1000) {
                    totalDoseDisplay = `कुल मात्रा: ${(totalDoseNeeded / 1000).toFixed(2)} लीटर (${dosePerBigha} ml/बीघा)`;
                } else {
                    totalDoseDisplay = `कुल मात्रा: ${totalDoseNeeded.toFixed(0)} ${unitStr} (${dosePerBigha} ${unitStr}/बीघा)`;
                }
            } else {
                totalDoseDisplay = `डोज़: ${rawDose}`;
            }
            
            itemsHtml += `
                <div class="item-sub-card" style="display: flex; gap: 10px; margin-bottom: 8px; background: #f9f9f9; padding: 8px; border-radius: 6px; border-left: 3px solid #4CAF50;">
                    <img src="${itemImg}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" alt="${escapeHtml(currentProdName)}">
                    <div style="flex: 1; font-size: 0.9rem;">
                        <h6 style="margin: 0; font-size: 0.95rem; color: #333; font-weight: bold;">${index + 1}. ${escapeHtml(currentProdName || 'दवाई')} (${escapeHtml(item.company || '—')})</h6>
                        <p style="margin: 2px 0; color: #666; font-size: 0.85rem;">🧪 ${escapeHtml(item.technical || '—')}</p>
                        
                        <p style="margin: 2px 0; font-weight: bold; color: #e65100;">${escapeHtml(totalDoseDisplay)}</p>
                        <p style="margin: 2px 0; color: #555; font-size: 0.85rem;"><i class="fa-solid fa-box"></i> <strong> पैकिंग:</strong> <span style="color: #1b5e20; font-weight: bold;">${escapeHtml(finalPackageSuggestion)}</span></p>
                        
                        <p style="margin: 2px 0; font-weight: bold; color: #2e7d32; font-size: 0.95rem;">💰 कीमत: ₹${finalPrice.toFixed(2)}</p>
                        ${item.advice ? `<p style="margin: 2px 0; color: #2e7d32; font-size: 0.85rem;">💡 सलाह: ${escapeHtml(item.advice)}</p>` : ''}
                    </div>
                </div>
            `;
        });
        itemsHtml += `</div>`;
    } else {
        packageTotalPrice = (parseFloat(pkg.price) || 0) * bigha;
    }

    return `
        <div class="package-card" style="border: 1px solid #4CAF50; border-radius: 12px; padding: 12px; margin-bottom: 15px; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div class="med-content-wrapper" style="margin-bottom: 10px;">
                <div class="med-right" style="width: 100%;">
                    <h4 class="med-name" style="color: #1b5e20; margin: 0 0 4px 0; font-size: 1.25rem; font-weight: bold;">${escapeHtml(name)}</h4>
                    ${pkg.noteAlert ? `<p style="margin: 4px 0; color: #d32f2f; font-size: 0.9rem;">⚠️ <strong>जरूरी सूचना:</strong> ${escapeHtml(pkg.noteAlert)}</p>` : ''}
                </div>
            </div>
            
            ${itemsHtml}
            
            <div class="package-total-summary" style="margin-top: 15px; padding-top: 10px; border-top: 2px solid #4CAF50; text-align: right;">
                <h4 style="margin: 0; color: #1b5e20; font-size: 1.15rem;">📦 ${bigha} बीघा पैकेज का कुल मूल्य: <span style="color: #e65100; font-size: 1.35rem; font-weight: bold;">₹${packageTotalPrice.toFixed(2)}</span></h4>
            </div>
            
            <button class="buy-btn" onclick="handleBuyNow('${safeName}', '₹${packageTotalPrice.toFixed(2)}')" style="margin-top: 12px; width: 100%;">
                <i class="fa-solid fa-cart-shopping"></i> अभी पैकेज खरीदें
            </button>
        </div>
    `;
}

function renderProductCardWithPacks(docData, totalBigha) {
    if (Array.isArray(docData)) {
        docData = docData[0];
    }
    if (!docData || !docData.name) return '';

    const dosePerBigha = getDosePerBigha(docData.doseSpray);
    const totalRequiredDose = dosePerBigha * totalBigha; 

    const isLiquid = (docData.packSize && String(docData.packSize).toLowerCase().includes('ml')) || 
                     (docData.doseSpray && String(docData.doseSpray).toLowerCase().includes('ml')) ||
                     (docData.packSize && String(docData.packSize).toLowerCase().includes('l'));
    
    const unit = isLiquid ? 'ml' : 'gram';

    let doseDisplay = "💧 —";
    let packingDetails = "पैकिंग जानकारी उपलब्ध नहीं";
    let totalPriceDisplay = "0.00";

    if (dosePerBigha > 0 && totalRequiredDose > 0) {
        doseDisplay = `💧 ${dosePerBigha} ${unit} / बीघा (कुल जरूरत: ${totalRequiredDose} ${unit})`;
        
        const result = calculateOptimalCombination(totalRequiredDose, docData);
        
        if (result.combo && result.combo.length > 0) {
            totalPriceDisplay = result.totalPrice.toFixed(2);
            packingDetails = result.combo.map(c => {
                return `<span>📦 ${c.name} - ${c.size} ${unit} के ${c.count} पैकेट</span>`;
            }).join("<br>");
        }
    }

    if (window._cardPrices) {
        window._cardPrices.push(parseFloat(totalPriceDisplay));
    }

    const safeId = docData.name.replace(/\s+/g, '-');
    const safeName = escapeHtml(docData.name).replace(/'/g, "\\'");
    const img = docData.img || 'https://via.placeholder.com/150?text=Agroain';
    const techName = docData.technical || '—';
    const companyName = docData.company || '—';
    const detailsDisplay = docData.extraDetails ? `<p class="med-details" style="margin: 6px 0; color: #555; font-size: 0.95rem;"><strong>📋 विवरण:</strong> ${escapeHtml(docData.extraDetails)}</p>` : '';

    return `
        <div class="product-card">
            <div class="med-content-wrapper">
                <div class="med-left">
                    <img src="${img}" class="med-photo zoomable" onclick="openZoom(this.src)" onerror="this.src='https://via.placeholder.com/150?text=Agroain'" alt="${safeName}">
                </div>
                <div class="med-right">
                    <h4 class="med-name">${safeName}</h4>
                    <p class="med-tech">🧪 ${escapeHtml(techName)}</p>
                    <p class="med-company">🏢 ${escapeHtml(companyName)}</p>
                    ${detailsDisplay}
                    <p id="dose-${safeId}"><strong>${doseDisplay}</strong></p>
                    <div id="pack-${safeId}" style="font-size: 0.95rem; margin: 8px 0; line-height: 1.4;">
                        ${packingDetails}
                    </div>
                    <div class="med-price-tag-inline" id="price-${safeId}" style="margin-top: 8px;">
                        कुल दवा मूल्य: ₹${totalPriceDisplay}
                    </div>
                </div>
            </div>
            <button class="buy-btn" onclick="handleBuyNow('${safeName}', '₹${totalPriceDisplay}')">
                <i class="fa-solid fa-cart-shopping"></i> अभी खरीदें
            </button>
        </div>
    `;
}

// ==========================================
// Main Content Renderer (Unified)
// ==========================================
function renderUnifiedContent() {
    const resultDiv = document.getElementById('result');
    const grandTotalContainer = document.getElementById('grandTotalContainer');
    if (!resultDiv) return;

    resultDiv.innerHTML = '';
    window._cardPrices = [];

    if (grandTotalContainer) {
        grandTotalContainer.innerHTML = '';
        grandTotalContainer.style.display = 'none';
    }

    let unifiedContent = document.createElement('div');
    unifiedContent.id = 'unifiedContent';
    resultDiv.appendChild(unifiedContent);

    let html = '';

    if (currentSearchMode === 'day') {
        if (filteredPackages.length > 0) {
            const packagesPerPage = 1; 
            
            const totalPages = Math.ceil(filteredPackages.length / packagesPerPage);
            if (currentPackagePage > totalPages) currentPackagePage = 1;

            const start = (currentPackagePage - 1) * packagesPerPage;
            const end = start + packagesPerPage;
            const pageItems = filteredPackages.slice(start, end);

            if (window._cropStagesHTML) {
                html += window._cropStagesHTML;
            }

            html += renderPaginationHTML(filteredPackages.length, currentPackagePage, packagesPerPage, 'goToPackagePage');

            pageItems.forEach(pkg => {
                html += renderPackageCard(pkg, currentBigha);
            });

            if (grandTotalContainer) {
                grandTotalContainer.style.display = 'none';
            }
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

            const totalGroups = groups.length;
            const productsPerPage = 1; 
            
            const totalPages = Math.ceil(totalGroups / productsPerPage);
            if (currentProductPage > totalPages) currentProductPage = 1;
            
            const start = (currentProductPage - 1) * productsPerPage;
            const end = Math.min(start + productsPerPage, totalGroups);
            const pageGroups = groups.slice(start, end);

            html += renderPaginationHTML(totalGroups, currentProductPage, productsPerPage, 'goToProductPage');

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
            }
        } else {
            html = "<p class='no-results'>😕 कोई दवाई नहीं मिली।</p>";
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

function goToPackagePage(page) {
    currentPackagePage = page;
    renderUnifiedContent();
    document.getElementById('unifiedContent')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// Search Handlers
// ==========================================
async function handleSmartSearch() {
    const searchInput = document.getElementById('searchInput').value.trim();
    
    if (!searchInput) {
        alert("कृपया दवाई का नाम, कंपनी या फसल के दिन लिखें।");
        return;
    }

    await handleSownCase();
}

document.getElementById('searchInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        handleSmartSearch();
    }
});

function performTextSearch(query) {
    const queryLower = query.toLowerCase();
    const resultDiv = document.getElementById('result');
    
    const filteredProducts = allProducts.filter(item => 
        item.name.toLowerCase().includes(queryLower) || 
        item.company.toLowerCase().includes(queryLower) ||
        item.tech.toLowerCase().includes(queryLower)
    );

    if (filteredProducts.length === 0) {
        resultDiv.innerHTML = "<p>माफ करें, कोई परिणाम नहीं मिला।</p>";
    } else {
        renderResults(filteredProducts);
    }
}

async function handleSownCase() {
    if (isSearching) return;
    
    isSearching = true;
    const searchBtn = document.querySelector('.section button') || document.querySelector('button[onclick*="handleSmartSearch"]');
    const originalBtnText = searchBtn ? searchBtn.innerHTML : '🔍 दवाई और पैकेज देखें';
    
    if (searchBtn) {
        searchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-pulse"></i> खोज रहे हैं...';
        searchBtn.disabled = true;
    }
    
    try {
        const bighaSelect = document.getElementById('bigha');
        const customBighaInput = document.getElementById('customBigha');
        const cropSelect = document.getElementById('cropSelect');
        const searchInput = document.getElementById('searchInput');
        const resTitle = document.getElementById('resTitle');
        const resultDiv = document.getElementById('result');
        const grandTotalContainer = document.getElementById('grandTotalContainer');

        if (bighaSelect && bighaSelect.value === 'other') {
            currentBigha = parseFloat(customBighaInput.value) || 1;
        } else {
            currentBigha = bighaSelect ? (parseFloat(bighaSelect.value) || 1) : 1;
        }

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
                const minAge = parseInt(pkg.ageMin || 0, 10);
                const maxAge = parseInt(pkg.ageMax || 999, 10);
                const ageMatch = day >= minAge && day <= maxAge;
                const typeMatch = !((pkg.packageType || '').includes('पहले') && day > 0);
                return cropMatch && ageMatch && typeMatch;
            });
            
            filteredProducts = [];
            currentPackagePage = 1;
        } 
        else {
            const searchLower = inputVal.toLowerCase().trim();
            
            filteredProducts = allProducts.filter(p => {
                if (!p) return false;
                const pName = p.name ? p.name.toLowerCase() : '';
                const pTech = p.technical ? p.technical.toLowerCase() : '';
                const pComp = p.company ? p.company.toLowerCase() : '';
                return pName.includes(searchLower) || pTech.includes(searchLower) || pComp.includes(searchLower);
            });
            
            if (filteredProducts.length > 0) {
                currentSearchMode = 'name';
                if (resTitle) resTitle.innerText = `🔎 परिणाम: "${inputVal}"`;
                filteredPackages = [];
            } else {
                currentSearchMode = 'technical';
                if (resTitle) resTitle.innerText = `⚠️ "${inputVal}" नाम की कोई दवाई नहीं मिली। तकनीकी नाम से खोज रहे हैं...`;
                
                const normalizedSearch = normalizeTechnicalName(inputVal);
                filteredProducts = allProducts.filter(p => 
                    p && p.technical && normalizeTechnicalName(p.technical).includes(normalizedSearch)
                );
                
                if (filteredProducts.length === 0) {
                    if (resultDiv) {
                        resultDiv.innerHTML = `
                        <div class='success-box'>
                            ⚠️ माफ़ करें, "${escapeHtml(inputVal)}" से मिलती-जुलती कोई दवाई या तकनीकी नाम हमारे डेटाबेस में नहीं है।<br>
                            कृपया कोई और नाम लिखकर खोजें।
                        </div>`;
                    }
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
        if (resultDiv) resultDiv.innerHTML = "<div class='success-box'>⚠️ कुछ तकनीकी गड़बड़ हुई है।</div>";
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

        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const stage = child.val();
                if (stage && stage.crop && doesCropMatch(stage.crop, currentCrop) && day >= stage.start && day <= stage.end) {
                    stagesHtml += `
                        <div class="success-box crop-stage-advice">
                            <h3 style="margin-top:0; color:var(--dark, #333);"><i class="fa-solid fa-leaf"></i> ${escapeHtml(stage.title)}</h3>
                            <p>${escapeHtml(stage.msg)}</p>
                            ${stage.alert ? `<div class="alert-info">⚠️ ${escapeHtml(stage.alert)}</div>` : ''}
                        </div>`;
                    stageFound = true;
                }
            });
        }

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

// ==========================================
// Razorpay Payment Gateway Integration
// ==========================================
function handleBuyNow(productOrPackageName, price) {
    let numericPrice = parseFloat(price.replace(/[^\d.]/g, ''));
    if (isNaN(numericPrice) || numericPrice <= 0) {
        alert("❌ भुगतान राशि सही नहीं है।");
        return;
    }

    let amountInPaise = Math.round(numericPrice * 100);

    let customerName = prompt("अपना नाम दर्ज करें:");
    if (!customerName) return;

    let customerPhone = prompt("अपना 10 अंकों का मोबाइल नंबर दर्ज करें:");
    if (!customerPhone || customerPhone.length < 10) {
        alert("⚠️ सही मोबाइल नंबर जरूरी है।");
        return;
    }

    let customerAddress = prompt("अपना पूरा पता दर्ज करें (गाँव, ज़िला, राज्य):");
    if (!customerAddress) {
        alert("⚠️ डिलीवरी के लिए पता ज़रूरी है।");
        return;
    }

    let customerPincode = prompt("अपना 6 अंकों का पिन कोड दर्ज करें:");
    if (!customerPincode || customerPincode.length !== 6 || isNaN(customerPincode)) {
        alert("⚠️ सही 6 अंकों का पिन कोड जरूरी है।");
        return;
    }

    const options = {
        "key": "rzp_test_SYcsMs0hCrXw6K",
        "amount": amountInPaise,
        "currency": "INR",
        "name": "Agroain",
        "description": `${productOrPackageName} (${currentBigha} बीघा खेत के लिए)`,
        "image": "https://via.placeholder.com/150?text=Agroain",
        "handler": function (response) {
            alert(`🎉 भुगतान सफल!\nपेमेंट ID: ${response.razorpay_payment_id}`);
            saveSuccessfulOrder(
                response.razorpay_payment_id,
                productOrPackageName,
                numericPrice,
                customerName,
                customerPhone,
                customerAddress,
                customerPincode
            );
        },
        "prefill": {
            "name": customerName,
            "contact": customerPhone
        },
        "theme": {
            "color": "#4CAF50"
        },
        "modal": {
            "ondismiss": function(){
                alert("❌ भुगतान रद्द कर दिया गया था।");
            }
        }
    };

    const rzp = new Razorpay(options);
    rzp.open();
}

// ==========================================
// Firebase में सफल ऑर्डर सेव करना + एडमिन नोटिफिकेशन
// ==========================================
async function saveSuccessfulOrder(paymentId, itemName, finalPrice, name, phone, address, pincode) {
    if (!db) {
        console.error("Firebase उपलब्ध नहीं है, लेकिन पेमेंट सफल रहा। ID:", paymentId);
        return;
    }
    
    try {
        const orderData = {
            paymentId: paymentId,
            customerName: name.trim(),
            customerPhone: phone.trim(),
            customerAddress: address.trim(),
            customerPincode: pincode.trim(),
            itemName: itemName,
            amountPaid: finalPrice,
            crop: currentCropHindi || "सामान्य",
            bigha: currentBigha,
            status: "Paid / Confirmed",
            timestamp: new Date().toISOString()
        };

        await db.ref('successful_orders').push(orderData);
        console.log("✅ ऑर्डर Firebase में सुरक्षित हो गया!");

        // 🔔 एडमिन को पुश नोटिफिकेशन भेजें
        sendPushNotificationToAdmin(orderData);

    } catch (error) {
        console.error("❌ ऑर्डर सेव करने में त्रुटि:", error);
        alert("भुगतान सफल रहा, लेकिन डेटाबेस सिंक में समस्या आई। कृपया अपनी पेमेंट ID नोट रखें: " + paymentId);
    }
}

// ==========================================
// FCM पुश नोटिफिकेशन भेजने का फंक्शन
// ==========================================
async function sendPushNotificationToAdmin(orderDetails) {
    try {
        const tokenSnap = await db.ref('admin_token').once('value');
        const adminToken = tokenSnap.val();
        if (!adminToken) {
            console.warn('Admin token not available');
            return;
        }

        // ⚠️ यहाँ अपनी असली Firebase Server Key डालें
        const serverKey = "AIzaSyB4S45t4U6nU7Zgak99EuLBtC5fUY6u5BQ";

        const payload = {
            to: adminToken,
            notification: {
                title: "🔥 नया ऑर्डर!",
                body: `${orderDetails.customerName} ने ${orderDetails.itemName} ऑर्डर किया। ₹${orderDetails.amountPaid}`,
                click_action: "https://agroain.com/admin.html"
            },
            data: {
                paymentId: orderDetails.paymentId,
                customerName: orderDetails.customerName,
                itemName: orderDetails.itemName
            }
        };

        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'key=' + serverKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('FCM error:', await response.text());
        }
    } catch (error) {
        console.error('Push notification failed:', error);
    }
}

// ==========================================
// Image Zoom
// ==========================================
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