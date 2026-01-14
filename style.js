let body = document.querySelector("body");
let imagesContainer = body.querySelector('.masonry');
let input = body.querySelector("form input");
let submit = body.querySelector("form button");
let loader = document.getElementById("loader");
let noResults = document.getElementById("noResults");
let imageCount = document.getElementById("imageCount");

// Navigation
let exploreBtn = document.getElementById("exploreBtn");
let favoritesBtn = document.getElementById("favoritesBtn");
let collectionsBtn = document.getElementById("collectionsBtn");
let statsBtn = document.getElementById("statsBtn");
let historyBtn = document.getElementById("historyBtn");
let exploreSection = document.getElementById("exploreSection");
let favoritesSection = document.getElementById("favoritesSection");
let collectionsSection = document.getElementById("collectionsSection");
let statsSection = document.getElementById("statsSection");
let historySection = document.getElementById("historySection");
let favBadge = document.getElementById("favBadge");

// Theme
let themeBtn = document.getElementById("themeBtn");
let themeModal = document.getElementById("themeModal");
let primaryColorInput = document.getElementById("primaryColor");
let accentColorInput = document.getElementById("accentColor");

// Filters
let filterToggle = document.getElementById("filterToggle");
let filtersPanel = document.getElementById("filtersPanel");
let colorFilter = document.getElementById("colorFilter");
let orientationFilter = document.getElementById("orientationFilter");
let sizeFilter = document.getElementById("sizeFilter");

let arr = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let collections = JSON.parse(localStorage.getItem('collections')) || {};
let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
let analytics = JSON.parse(localStorage.getItem('analytics')) || {};
let ratings = JSON.parse(localStorage.getItem('ratings')) || {};
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let url;
let input_value;

const SUGGESTIONS = ["Nature", "City", "Travel", "Technology", "Food", "Mountains", "Ocean", "Art"];

// Initialize
window.addEventListener('load', function() {
    if (isDarkMode) {
        body.classList.add('dark-mode');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    updateFavoritesBadge();
    loadSuggestions();
    setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
    exploreBtn.addEventListener('click', () => switchSection('explore'));
    favoritesBtn.addEventListener('click', () => switchSection('favorites'));
    collectionsBtn.addEventListener('click', () => switchSection('collections'));
    statsBtn.addEventListener('click', () => switchSection('stats'));
    historyBtn.addEventListener('click', () => switchSection('history'));
    
    themeBtn.addEventListener('click', toggleDarkMode);
    filterToggle.addEventListener('click', () => {
        filtersPanel.style.display = filtersPanel.style.display === 'none' ? 'grid' : 'none';
    });
    
    // Filter listeners - trigger search when filters change
    if (colorFilter) {
        colorFilter.addEventListener('change', () => {
            if (arr.length > 0) searchImages();
        });
    }
    if (orientationFilter) {
        orientationFilter.addEventListener('change', () => {
            if (arr.length > 0) searchImages();
        });
    }
    if (sizeFilter) {
        sizeFilter.addEventListener('change', () => {
            if (arr.length > 0) searchImages();
        });
    }
    
    // Theme modal
    const themeModal = document.getElementById('themeModal');
    const closeBtn = themeModal.querySelector('.close');
    closeBtn.addEventListener('click', () => themeModal.style.display = 'none');
    
    primaryColorInput.addEventListener('change', updateThemeColors);
    accentColorInput.addEventListener('change', updateThemeColors);
    
    document.querySelector('.reset-btn').addEventListener('click', resetTheme);
}

function switchSection(section) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    exploreSection.classList.remove('active');
    favoritesSection.classList.remove('active');
    collectionsSection.classList.remove('active');
    statsSection.classList.remove('active');
    historySection.classList.remove('active');
    
    if (section === 'explore') {
        exploreBtn.classList.add('active');
        exploreSection.classList.add('active');
    } else if (section === 'favorites') {
        favoritesBtn.classList.add('active');
        favoritesSection.classList.add('active');
        showFavorites();
    } else if (section === 'collections') {
        collectionsBtn.classList.add('active');
        collectionsSection.classList.add('active');
        showCollections();
    } else if (section === 'stats') {
        statsBtn.classList.add('active');
        statsSection.classList.add('active');
        showStats();
    } else if (section === 'history') {
        historyBtn.classList.add('active');
        historySection.classList.add('active');
        showHistory();
    }
}

// Theme Functions
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    body.classList.toggle('dark-mode');
    themeBtn.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', isDarkMode);
}

function updateThemeColors() {
    const primary = primaryColorInput.value;
    const accent = accentColorInput.value;
    
    document.documentElement.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`);
    document.documentElement.style.setProperty('--accent-color', accent);
    
    localStorage.setItem('themeColors', JSON.stringify({primary, accent}));
}

function resetTheme() {
    primaryColorInput.value = '#667eea';
    accentColorInput.value = '#f093fb';
    updateThemeColors();
}

function loadSuggestions() {
    const suggestionsContainer = document.getElementById('suggestions');
    suggestionsContainer.innerHTML = '';
    SUGGESTIONS.forEach(term => {
        const chip = document.createElement('span');
        chip.className = 'suggestion-chip';
        chip.textContent = term;
        chip.onclick = () => {
            input.value = term;
            input_value = term;
            searchImages();
        };
        suggestionsContainer.appendChild(chip);
    });
}

// Event listeners
submit.onclick = function(event) {
    event.preventDefault();
    if (input.value !== "") {
        input_value = input.value;
        searchImages();
        input.value = "";
    }
};

input.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        submit.click();
    }
});

function searchImages() {
    loader.style.display = 'block';
    noResults.style.display = 'none';
    imagesContainer.innerHTML = '';

    addToHistory(input_value);

    // Build URL with filters
    let filterParams = '';
    
    // Color filter
    if (colorFilter && colorFilter.value) {
        filterParams += `&color=${colorFilter.value}`;
    }
    
    // Orientation filter
    if (orientationFilter && orientationFilter.value) {
        filterParams += `&orientation=${orientationFilter.value}`;
    }

    url = `https://api.unsplash.com/search/photos?pages=1&per_page=30&query=${input_value}${filterParams}&client_id=9DfKLVeojo-HjCz2OtglPgz5HDYm2tVJtDBUVx_lNWw`;
    
    let res = new XMLHttpRequest();
    res.open('get', url, true);
    res.onreadystatechange = function() {
        if (res.status == 200 && res.readyState == 4) {
            setTimeout(() => {
                loader.style.display = 'none';
                let data = res.response;
                let resjs = JSON.parse(data);
                arr = resjs.results;
                
                // Apply client-side size filter if selected
                if (sizeFilter && sizeFilter.value) {
                    arr = arr.filter(image => {
                        const aspectRatio = image.width / image.height;
                        switch(sizeFilter.value) {
                            case 'square':
                                return aspectRatio > 0.8 && aspectRatio < 1.2;
                            case 'portrait':
                                return aspectRatio < 0.8;
                            case 'landscape':
                                return aspectRatio > 1.2;
                            default:
                                return true;
                        }
                    });
                }
                
                if (arr.length === 0) {
                    noResults.style.display = 'block';
                    imageCount.textContent = 'No images found';
                } else {
                    appearItems();
                    imageCount.textContent = `Found ${arr.length} images for "${input_value}"`;
                }
            }, 1000);
        }
    };
    res.send();
}

function appearItems() {
    imagesContainer.innerHTML = '';
    arr.forEach((el, index) => {
        let wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        wrapper.style.animationDelay = `${index * 0.05}s`;

        let img = document.createElement('img');
        img.src = el.urls.small;
        img.alt = el.alt_description || 'Image';
        img.loading = 'lazy';
        
        let overlay = document.createElement('div');
        overlay.className = 'image-overlay';
        let overlayContent = document.createElement('div');
        overlayContent.className = 'image-overlay-content';
        overlayContent.innerHTML = `<i class="fas fa-expand-alt"></i><p>View Full Image</p>`;
        overlay.appendChild(overlayContent);

        let actions = document.createElement('div');
        actions.className = 'image-actions';

        let likeBtn = document.createElement('button');
        likeBtn.className = 'action-btn';
        let isFav = favorites.some(fav => fav.id === el.id);
        likeBtn.innerHTML = `<i class="fas fa-heart"></i>`;
        if (isFav) likeBtn.classList.add('liked');
        likeBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(el, likeBtn);
        };

        let shareBtn = document.createElement('button');
        shareBtn.className = 'action-btn';
        shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
        shareBtn.onclick = (e) => {
            e.stopPropagation();
            shareImage(el.urls.regular, el.id);
        };

        let downloadBtn = document.createElement('button');
        downloadBtn.className = 'action-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        downloadBtn.onclick = (e) => {
            e.stopPropagation();
            downloadImage(el.urls.regular, el.id);
        };

        let collBtn = document.createElement('button');
        collBtn.className = 'action-btn';
        collBtn.innerHTML = '<i class="fas fa-folder-plus"></i>';
        collBtn.onclick = (e) => {
            e.stopPropagation();
            const collName = prompt('Collection name (create new or select existing):');
            if (collName) {
                addToCollection({
                    id: el.id,
                    src: el.urls.small,
                    regular: el.urls.regular,
                    alt: el.alt_description,
                    user: el.user.name
                }, collName);
            }
        };

        actions.appendChild(likeBtn);
        actions.appendChild(shareBtn);
        actions.appendChild(downloadBtn);
        actions.appendChild(collBtn);

        wrapper.appendChild(img);
        wrapper.appendChild(overlay);
        wrapper.appendChild(actions);

        wrapper.onclick = function() {
            openImageModal(el.urls.regular, el.user.name, el.id);
        };

        imagesContainer.appendChild(wrapper);
    });
}

// Enhanced Modal for full image view
function openImageModal(imageUrl, photographer, imageId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        position: relative;
        max-width: 90%;
        max-height: 90vh;
        animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        border-radius: 20px;
        box-shadow: 0 30px 80px rgba(240, 147, 251, 0.3);
    `;

    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = `
        position: absolute;
        top: -50px;
        right: 0;
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
    `;

    const infoBtn = document.createElement('button');
    infoBtn.innerHTML = '<i class="fas fa-info-circle"></i>';
    infoBtn.style.cssText = `
        background: rgba(102, 126, 234, 0.9);
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.1em;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    `;
    infoBtn.onmouseover = () => infoBtn.style.transform = 'scale(1.1)';
    infoBtn.onmouseout = () => infoBtn.style.transform = 'scale(1)';
    infoBtn.onclick = () => {
        modal.remove();
        shareImage(imageUrl, imageId);
    };

    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.style.cssText = `
        background: rgba(240, 147, 251, 0.9);
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.1em;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    `;

    downloadBtn.onmouseover = () => downloadBtn.style.transform = 'scale(1.1)';
    downloadBtn.onmouseout = () => downloadBtn.style.transform = 'scale(1)';
    downloadBtn.onclick = () => {
        downloadImage(imageUrl, imageId);
    };

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.style.cssText = `
        background: #fff;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.3em;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
    `;

    closeBtn.onmouseover = () => closeBtn.style.transform = 'scale(1.1)';
    closeBtn.onmouseout = () => closeBtn.style.transform = 'scale(1)';
    closeBtn.onclick = () => modal.remove();
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };

    buttonGroup.appendChild(infoBtn);
    buttonGroup.appendChild(downloadBtn);
    buttonGroup.appendChild(closeBtn);
    content.appendChild(img);
    content.appendChild(buttonGroup);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

function toggleFavorite(imageData, btn) {
    const index = favorites.findIndex(fav => fav.id === imageData.id);
    if (index > -1) {
        favorites.splice(index, 1);
        btn.classList.remove('liked');
    } else {
        favorites.push({
            id: imageData.id,
            src: imageData.urls.small,
            regular: imageData.urls.regular,
            alt: imageData.alt_description,
            user: imageData.user.name
        });
        btn.classList.add('liked');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesBadge();
}

function updateFavoritesBadge() {
    favBadge.textContent = favorites.length;
}

function showFavorites() {
    if (favorites.length === 0) {
        favoritesSection.innerHTML = '<div class="empty-state" style="display: block;"><i class="fas fa-bookmark"></i><h2>No favorites yet</h2><p>Start adding images to your collection</p></div>';
        return;
    }
    
    if (!favoritesSection.querySelector('.masonry')) {
        const container = document.createElement('div');
        container.className = 'images-container';
        const masonry = document.createElement('div');
        masonry.className = 'masonry';
        container.appendChild(masonry);
        favoritesSection.appendChild(container);
    }
    
    const favMasonry = favoritesSection.querySelector('.masonry');
    favMasonry.innerHTML = '';
    
    favorites.forEach((el, index) => {
        let wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        wrapper.style.animationDelay = `${index * 0.05}s`;

        let img = document.createElement('img');
        img.src = el.src;
        img.alt = el.alt || 'Favorite Image';
        
        let overlay = document.createElement('div');
        overlay.className = 'image-overlay';
        overlay.innerHTML = `<div class="image-overlay-content"><i class="fas fa-expand-alt"></i><p>View Full Image</p></div>`;

        let actions = document.createElement('div');
        actions.className = 'image-actions';
        let removeBtn = document.createElement('button');
        removeBtn.className = 'action-btn liked';
        removeBtn.innerHTML = '<i class="fas fa-heart"></i>';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            favorites = favorites.filter(fav => fav.id !== el.id);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            updateFavoritesBadge();
            showFavorites();
        };
        actions.appendChild(removeBtn);

        wrapper.appendChild(img);
        wrapper.appendChild(overlay);
        wrapper.appendChild(actions);
        wrapper.onclick = () => openImageModal(el.regular, el.user);
        favMasonry.appendChild(wrapper);
    });
}

function addToHistory(term) {
    const existingIndex = searchHistory.findIndex(item => item.term === term);
    if (existingIndex > -1) {
        searchHistory.splice(existingIndex, 1);
    }
    searchHistory.unshift({
        term: term,
        timestamp: new Date().toLocaleString()
    });
    if (searchHistory.length > 20) {
        searchHistory.pop();
    }
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
}

function showHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    if (searchHistory.length === 0) {
        historyList.innerHTML = '<div class="empty-state" style="display: block; grid-column: 1/-1;"><i class="fas fa-history"></i><h2>No history yet</h2><p>Your searches will appear here</p></div>';
        return;
    }
    
    searchHistory.forEach(item => {
        const histItem = document.createElement('div');
        histItem.className = 'history-item';
        histItem.innerHTML = `<div class="history-item-term">${item.term}</div><div class="history-item-time">${item.timestamp}</div>`;
        histItem.onclick = () => {
            input.value = item.term;
            input_value = item.term;
            switchSection('explore');
            searchImages();
        };
        historyList.appendChild(histItem);
    });
}

function downloadImage(imageUrl, imageId) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `pixelvault-${imageId}.jpg`;
    link.click();
}

function showCollections() {
    const collectionsList = document.getElementById('collectionsList');
    collectionsList.innerHTML = '';
    
    // Add new collection button
    const newBtn = document.createElement('button');
    newBtn.className = 'new-collection-btn';
    newBtn.innerHTML = '<i class="fas fa-plus"></i> New Collection';
    newBtn.onclick = createNewCollection;
    collectionsList.appendChild(newBtn);
    
    Object.keys(collections).forEach(collName => {
        const card = document.createElement('div');
        card.className = 'collection-card';
        const count = collections[collName].length;
        card.innerHTML = `
            <div class="collection-name">${collName}</div>
            <div class="collection-count">${count} images</div>
        `;
        card.onclick = () => viewCollection(collName);
        collectionsList.appendChild(card);
    });
}

function createNewCollection() {
    const name = prompt('Collection name:');
    if (name && !collections[name]) {
        collections[name] = [];
        localStorage.setItem('collections', JSON.stringify(collections));
        showCollections();
    }
}

function addToCollection(imageData, collectionName) {
    if (!collections[collectionName]) {
        collections[collectionName] = [];
    }
    collections[collectionName].push(imageData);
    localStorage.setItem('collections', JSON.stringify(collections));
}

function viewCollection(collectionName) {
    if (!imagesContainer.parentElement.querySelector('.masonry')) {
        const masonry = document.createElement('div');
        masonry.className = 'masonry';
        imagesContainer.parentElement.appendChild(masonry);
    }
    
    const collMasonry = imagesContainer.parentElement.querySelector('.masonry');
    collMasonry.innerHTML = '';
    
    collections[collectionName].forEach((el, index) => {
        // Display collection images
        let wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        wrapper.style.animationDelay = `${index * 0.05}s`;
        
        let img = document.createElement('img');
        img.src = el.src;
        img.alt = el.alt;
        
        let overlay = document.createElement('div');
        overlay.className = 'image-overlay';
        overlay.innerHTML = `<div class="image-overlay-content"><i class="fas fa-expand-alt"></i></div>`;
        
        wrapper.appendChild(img);
        wrapper.appendChild(overlay);
        wrapper.onclick = () => openImageModal(el.regular, el.user);
        collMasonry.appendChild(wrapper);
    });
}

function showStats() {
    const statsDashboard = document.getElementById('statsDashboard');
    statsDashboard.innerHTML = '';
    
    const totalSearches = searchHistory.length;
    const totalFavorites = favorites.length;
    const totalCollections = Object.keys(collections).length;
    const totalImages = Object.values(collections).reduce((sum, coll) => sum + coll.length, 0);
    
    const stats = [
        {label: 'Total Searches', value: totalSearches, icon: 'fa-search'},
        {label: 'Favorites', value: totalFavorites, icon: 'fa-heart'},
        {label: 'Collections', value: totalCollections, icon: 'fa-folder'},
        {label: 'Collection Images', value: totalImages, icon: 'fa-images'}
    ];
    
    stats.forEach(stat => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <i class="fas ${stat.icon}" style="font-size: 2em; margin-bottom: 10px;"></i>
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
        `;
        statsDashboard.appendChild(card);
    });
}

function shareImage(imageUrl, imageId) {
    const modal = document.createElement('div');
    modal.className = 'image-info-modal';
    modal.style.display = 'flex';
    
    const content = document.createElement('div');
    content.className = 'image-info-content';
    
    const rating = ratings[imageId] || 0;
    
    content.innerHTML = `
        <button class="info-close">&times;</button>
        <h2>Share & Rate</h2>
        
        <div class="info-item">
            <div class="info-label">Rate this image:</div>
            <div class="rating-container">
                ${[1,2,3,4,5].map(star => `
                    <span class="star ${star <= rating ? 'active' : ''}" data-rating="${star}">★</span>
                `).join('')}
            </div>
        </div>
        
        <div class="share-buttons">
            <button class="share-btn share-twitter" onclick="window.open('https://twitter.com/intent/tweet?url=${encodeURIComponent(imageUrl)}&text=Check out this amazing image!')">
                <i class="fab fa-twitter"></i> Twitter
            </button>
            <button class="share-btn share-facebook" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}')">
                <i class="fab fa-facebook"></i> Facebook
            </button>
            <button class="share-btn share-pinterest" onclick="window.open('https://pinterest.com/pin/create/button/?url=${encodeURIComponent(imageUrl)}')">
                <i class="fab fa-pinterest"></i> Pinterest
            </button>
            <button class="share-btn share-copy" onclick="copyToClipboard('${imageUrl}')">
                <i class="fas fa-copy"></i> Copy Link
            </button>
        </div>
    `;
    
    modal.appendChild(content);
    
    // Rating stars
    content.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', () => {
            const newRating = parseInt(star.dataset.rating);
            ratings[imageId] = newRating;
            localStorage.setItem('ratings', JSON.stringify(ratings));
            content.querySelectorAll('.star').forEach((s, idx) => {
                if (idx < newRating) s.classList.add('active');
                else s.classList.remove('active');
            });
        });
    });
    
    content.querySelector('.info-close').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    document.body.appendChild(modal);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Link copied to clipboard!');
    });
}
