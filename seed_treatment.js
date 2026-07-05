// ==========================================
// Firebase Configuration
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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let allProducts = []; 

window.onload = async () => {
    await fetchProductsFromFirebase();
    
    // इनपुट इवेंट्स - लाइव काम करने के लिए
    document.getElementById('searchButton').addEventListener('click', () => {
        hideSuggestions();
        filterTreatments();
    });
    document.getElementById('cropSelect').addEventListener('change', filterTreatments);
    document.getElementById('seedWeight').addEventListener('input', filterTreatments);
    document.getElementById('weightUnit').addEventListener('change', filterTreatments);
    
    // सर्च बार में टाइप करते ही सजेशन्स दिखाने के लिए इवेंट
    document.getElementById('searchBar').addEventListener('input', handleSearchInput);
    
    // बाहर कहीं क्लिक करने पर सजेशन बॉक्स छुप जाए
    document.addEventListener('click', function(e) {
        if (e.target.id !== 'searchBar' && e.target.id !== 'suggestionsBox') {
            hideSuggestions();
        }
    });
};

// ==========================================
// 1. फायरबेस से डेटा लोड करना
// ==========================================
async function fetchProductsFromFirebase() {
    try {
        allProducts = [];
        let snapshot = await db.ref('inventory').once('value');
        let data = snapshot.val();
        
        if (!data) {
            snapshot = await db.ref('products').once('value');
            data = snapshot.val();
        }

        if (data) {
            for (let key in data) {
                if (data[key]) {
                    allProducts.push({ id: key, ...data[key] });
                }
            }
        }
        
        document.getElementById('loading').style.display = 'none';
        
        // मुख्य फ़िल्टर और लाइव डेटाबेस ऑडिट दोनों यहाँ चलेंगे
        filterTreatments(); 
        checkDatabaseDoses(); 

    } catch (error) {
        console.error("डेटाबेस लोड एरर:", error);
        document.getElementById('loading').innerText = "❌ डेटा लोड नहीं हो सका।";
    }
}

// ==========================================
// 2. लाइव सजेशन (Suggestions) हैंडलर
// ==========================================
// ==========================================================
// 1. हैंडल सर्च इनपुट (Suggestions के लिए)
// ==========================================================
function handleSearchInput() {
    const searchQuery = this.value.toLowerCase().trim();
    const suggestionsBox = document.getElementById('suggestionsBox');
    const selectedCrop = document.getElementById('cropSelect').value.toLowerCase().trim();

    if (searchQuery === "") {
        hideSuggestions();
        filterTreatments();
        return;
    }

    let html = '';
    let matchCount = 0;

    allProducts.forEach(prod => {
        let rawDose = prod.doseSeed || prod.seed_treatment_dose || "";
        let doseStr = rawDose.toString().trim();

        // नया फिल्टर: खाली, 0, no, या डैश (—, -) होने पर हटा दें
        if (!rawDose || doseStr === "" || doseStr === "0" || doseStr === "—" || doseStr === "-" || doseStr.toLowerCase() === "no") {
            return; 
        }

        const prodCrop = prod.crops ? prod.crops.toLowerCase().trim() : (prod.crop ? prod.crop.toLowerCase().trim() : '');
        const isCropMatch = prodCrop.includes(selectedCrop) || prodCrop.includes('all') || prodCrop === '';
        if (!isCropMatch) return; 

        const name = prod.name ? prod.name.toLowerCase().trim() : '';
        const tech = prod.technical ? prod.technical.toLowerCase().trim() : '';

        if (name.includes(searchQuery) || tech.includes(searchQuery)) {
            matchCount++;
            html += `
                <div class="suggestion-item" onclick="selectSuggestion('${prod.name.replace(/'/g, "\\'")}')">
                    <span><i class="fa-solid fa-flask-vial" style="color:var(--primary); margin-right:8px;"></i> ${prod.name}</span>
                    <span class="tech-span">${prod.technical || ''}</span>
                </div>
            `;
        }
    });

    if (matchCount > 0) {
        suggestionsBox.innerHTML = html;
        suggestionsBox.style.display = 'block';
    } else {
        suggestionsBox.innerHTML = `<div class="suggestion-item" style="color:#999; cursor:default;">कोई बीज उपचार दवाई नहीं मिली</div>`;
        suggestionsBox.style.display = 'block';
    }
}
// =====================================
// 2. फिल्टर ट्रीटमेंट्स (मुख्य रिजल्ट्स दिखाने के लिए)
// ==========================================================

// सजेशन पर क्लिक हैंडलर
function selectSuggestion(prodName) {
    document.getElementById('searchBar').value = prodName;
    hideSuggestions();
    filterTreatments(); 
}

// ==========================================
// 3. मुख्य फ़िल्टर और कार्ड डिस्प्ले फंक्शन
// ==========================================

// 4. सुधरा हुआ डोज़ डिस्प्ले (New Format Compatible)
// ==========================================
function renderOldStyleCard(prod, totalWeightInKg, rawDose) {
    const name = prod.name || 'दवाई का नाम';
    const tech = prod.technical || '';
    const company = prod.company || '';
    const img = prod.img || 'https://via.placeholder.com/300x180?text=Agroain';
    
    // डोज़ में से सिर्फ पहला नंबर निकालना (जैसे "2.5 ml / par kg seed" में से 2.5)
    const matchMatch = rawDose.match(/[0-9.]+/);
    const baseDoseNumber = matchMatch ? parseFloat(matchMatch[0]) : 0;
    
    // यूनिट को साफ़ करना (ml या gm छाँटना)
    let unitType = "gm/ml"; 
    if (rawDose.toLowerCase().includes('ml')) {
        unitType = "ml";
    } else if (rawDose.toLowerCase().includes('gm') || rawDose.toLowerCase().includes('gram')) {
        unitType = "gm";
    } else if (rawDose.toLowerCase().includes('kg') && !rawDose.toLowerCase().includes('par kg')) {
        unitType = "kg";
    }

    // लाइव गुणा भाग (नंबर * वजन)
    const finalDose = baseDoseNumber * totalWeightInKg;
    const price = parseFloat(prod.price) || 0;

    return `
        <div class="card">
            <img class="card-img" src="${img}" onerror="this.src='https://via.placeholder.com/300x180?text=Agroain'">
            <div class="card-body">
                <h3 class="card-title">${name}</h3>
                ${tech ? `<p class="card-tech">🧪 ${tech}</p>` : ''}
                ${company ? `<p class="card-company">🏢 कंपनी: ${company}</p>` : ''}
                
                <div class="dose-box">
                    <p class="dose-title">🧪 आपके बीज के लिए कुल आवश्यक मात्रा:</p>
                    <p class="dose-value">${finalDose > 0 ? finalDose.toFixed(1) + ' ' + unitType : 'आवश्यकतानुसार'}</p>
                    <small style="color:#777;">(डेटाबेस अनुशंसित डोज़: ${rawDose})</small>
                </div>
                
                <div class="price-tag">💰 कीमत: ₹${price.toFixed(2)}</div>
                
                <button class="buy-btn" onclick="handleBuyNow('${name.replace(/'/g, "\\'")}', ${price})">
                    <i class="fa-solid fa-cart-shopping"></i> अभी खरीदें
                </button>
            </div>
        </div>
    `;
}

// सजेशन बॉक्स बंद करने के लिए
function hideSuggestions() {
    const box = document.getElementById('suggestionsBox');
    if(box) box.style.display = 'none';
}

// खरीदें बटन रिस्पांस
function handleBuyNow(prodName, price) {
    alert(`🛒 "${prodName}" का आदेश जल्द ही चालू होगा!\nकुल मूल्य: ₹${price}`);
}

// ==========================================
// 5. डेटाबेस ऑडिट फंक्शन (कंसोल टेस्टिंग के लिए)
// ==========================================
function checkDatabaseDoses() {
    console.log("=== 🔍 डेटाबेस डोज़ ऑडिट रिपोर्ट ===");
    let seedTreatmentCount = 0;
    let sprayOnlyCount = 0;

    allProducts.forEach(prod => {
        let rawDose = prod.doseSeed || prod.seed_treatment_dose || "";
        rawDose = rawDose.toString().trim().toLowerCase();

        if (rawDose === "" || rawDose === "0" || rawDose === "no") {
            sprayOnlyCount++;
            console.log(`❌ छिड़काव वाली (Hide होगी): ${prod.name} -> डोज़: "${rawDose}"`);
        } else {
            seedTreatmentCount++;
            console.log(`✅ बीज उपचार (Show होगी): ${prod.name} -> डोज़: "${rawDose}"`);
        }
    });

    console.log("=================================");
    console.log(`कुल बीज उपचार दवाइयाँ: ${seedTreatmentCount}`);
    console.log(`कुल छिड़काव वाली दवाइयाँ (Filtered): ${sprayOnlyCount}`);
}
