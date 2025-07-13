// Ian Christian F. Amistoso 
// LFCA322A012 
// IPT1 API PROJECT 

const weatherApiKey = "c0d5ae6a7db44ff4a144b9726a224648"; 
const newsApiKey = "70f1b191bd4d5ec6089b52dafc9b3716"; 

// Theme management
let currentTheme = localStorage.getItem('theme') || 'light';

// Search state management
let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
let searchTimeout = null;
let lastSearchQuery = '';

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    applyTheme(currentTheme);
    fetchNews('general');
    setupEventListeners();
    loadSearchHistory();
    // Clear input button logic
    const cityInput = document.getElementById('cityInput');
    const clearBtn = document.getElementById('clearCityInputBtn');
    cityInput.addEventListener('input', function() {
        clearBtn.style.display = cityInput.value ? 'block' : 'none';
    });
    clearBtn.addEventListener('click', function() {
        cityInput.value = '';
        clearBtn.style.display = 'none';
        document.getElementById('citySuggestions').innerHTML = '';
        cityInput.focus();
        showSearchHistory();
    });
    // Keyboard navigation for autocomplete
    cityInput.addEventListener('keydown', handleCityAutocompleteKeydown);
});

// --- Keyboard navigation for city autocomplete ---
let citySuggestionIndex = -1;
function handleCityAutocompleteKeydown(e) {
    const suggestions = Array.from(document.querySelectorAll('#citySuggestions .suggestion-item'));
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        citySuggestionIndex = (citySuggestionIndex + 1) % suggestions.length;
        updateCitySuggestionFocus(suggestions);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        citySuggestionIndex = (citySuggestionIndex - 1 + suggestions.length) % suggestions.length;
        updateCitySuggestionFocus(suggestions);
    } else if (e.key === 'Enter') {
        if (citySuggestionIndex >= 0 && citySuggestionIndex < suggestions.length) {
            suggestions[citySuggestionIndex].click();
            citySuggestionIndex = -1;
        }
    } else if (e.key === 'Escape') {
        document.getElementById('citySuggestions').innerHTML = '';
        citySuggestionIndex = -1;
    }
}
function updateCitySuggestionFocus(suggestions) {
    suggestions.forEach((el, i) => {
        if (i === citySuggestionIndex) {
            el.classList.add('focused');
            el.setAttribute('aria-selected', 'true');
            el.scrollIntoView({block:'nearest'});
        } else {
            el.classList.remove('focused');
            el.setAttribute('aria-selected', 'false');
        }
    });
}

// Theme toggle function
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
    
    // Update theme toggle button
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.innerHTML = currentTheme === 'light' ? '🌙' : '☀️';
}

// Apply theme to document
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// Setup event listeners
function setupEventListeners() {
    // Enter key support for search inputs
    document.getElementById('cityInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            getWeather();
        }
    });
    
    document.getElementById('newsInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchNews();
        }
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            document.getElementById('citySuggestions').innerHTML = '';
        }
    });
    
    // Add input event listeners for real-time search
    document.getElementById('cityInput').addEventListener('input', function(e) {
        debounceSearch(autoCompleteCity, 300);
    });
    
    document.getElementById('newsInput').addEventListener('input', function(e) {
        debounceSearch(() => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                searchNewsSuggestions(query);
            }
        }, 300);
    });
}

// Debounce function for search
function debounceSearch(func, delay) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(func, delay);
}

// Load search history
function loadSearchHistory() {
    if (searchHistory.length > 0) {
        showSearchHistory();
    }
}

// Show search history
function showSearchHistory() {
    const suggestionsContainer = document.getElementById('citySuggestions');
    if (searchHistory.length === 0) {
        suggestionsContainer.innerHTML = '';
        return;
    }
    const historyItems = searchHistory.slice(0, 5).map((city, idx) => {
        return `<div onclick="selectCity('${city}')" class="suggestion-item history-item" tabindex="0" role="option" aria-selected="false" data-index="${idx}">
            <span class="suggestion-city">${city}</span>
            <span class="suggestion-type">Recent</span>
        </div>`;
    }).join('');
    suggestionsContainer.innerHTML = `
        <div class="suggestions-header">
            <span>Recent Searches</span>
            <button onclick="clearSearchHistory()" class="clear-history" type="button" tabindex="0">Clear All</button>
        </div>
        ${historyItems}
    `;
}

// Clear search history
function clearSearchHistory() {
    searchHistory = [];
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    document.getElementById('citySuggestions').innerHTML = '';
}

// Add to search history
function addToSearchHistory(city) {
    // Remove if already exists
    searchHistory = searchHistory.filter(item => item !== city);
    // Add to beginning
    searchHistory.unshift(city);
    // Keep only last 10 items
    searchHistory = searchHistory.slice(0, 10);
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
}

// Enhanced Autocomplete Function for City Search
async function autoCompleteCity(event) {
    const query = document.getElementById("cityInput").value.trim();
    const suggestionsContainer = document.getElementById("citySuggestions");
    document.getElementById('cityInput').setAttribute('aria-expanded', query.length >= 2 ? 'true' : 'false');
    if (event && (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === 'Escape')) return;
    citySuggestionIndex = -1;
    if (query.length < 2) { 
        if (searchHistory.length > 0) {
            showSearchHistory();
        } else {
            suggestionsContainer.innerHTML = '';
        }
        return;
    }

    // Show loading state
    suggestionsContainer.innerHTML = '<div class="suggestion-item loading">Searching cities...</div>';

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/find?q=${query},PH&appid=${weatherApiKey}`);
        const data = await response.json();

        if (data.list && data.list.length > 0) { 
            const suggestions = data.list.slice(0, 8).map((city, idx) => {
                const isInHistory = searchHistory.includes(city.name);
                return `<div onclick="selectCity('${city.name}, ${city.sys.country}')" class="suggestion-item${isInHistory ? ' history-item' : ''}" tabindex="0" role="option" aria-selected="false" data-index="${idx}">
                    <span class="suggestion-city">${city.name}</span>
                    <span class="suggestion-country">${city.sys.country}</span>
                    ${isInHistory ? '<span class="suggestion-type">Recent</span>' : ''}
                </div>`;
            }).join('');
            suggestionsContainer.innerHTML = suggestions;
        } else {
            suggestionsContainer.innerHTML = `
                <div class="suggestion-item no-results" tabindex="-1">
                    <span class="suggestion-city">No cities found</span>
                    <span class="suggestion-hint">Try a different spelling</span>
                </div>`;
        }
    } catch (error) {
        console.error("Error fetching city suggestions:", error);
        suggestionsContainer.innerHTML = `
            <div class="suggestion-item error" tabindex="-1">
                <span class="suggestion-city">Error loading suggestions</span>
                <span class="suggestion-hint">Please try again</span>
            </div>`;
    }
}

// Select a City from Suggestions
function selectCity(cityName) {
    document.getElementById("cityInput").value = cityName; 
    document.getElementById("citySuggestions").innerHTML = ''; 
    addToSearchHistory(cityName.split(',')[0]); // Store only city name
    getWeather(); 
}

// Enhanced Weather Search with Validation
async function getWeather() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) {
        showNotification("Please enter a city name.", "warning");
        return;
    }

    // Validate city name format
    if (!/^[a-zA-Z\s,]+$/.test(city)) {
        showNotification("Please enter a valid city name (letters and spaces only).", "warning");
        return;
    }

    try {
        showLoading("weatherResult"); 
        
        // Add search animation
        const searchButton = document.querySelector('.search-button');
        searchButton.innerHTML = '<span class="button-icon">⏳</span><span class="button-text">Searching...</span>';
        searchButton.disabled = true;
        
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`
        );
        const data = await response.json();
        
        // Reset button
        searchButton.innerHTML = '<span class="button-icon">🔍</span><span class="button-text">Search</span>';
        searchButton.disabled = false;
        
        if (data.cod !== 200) {
            document.getElementById("weatherResult").innerHTML = `
                <div class="weather-card error-card">
                    <div class="text-error">
                        <span class="error-icon">❌</span>
                        <h3>City Not Found</h3>
                        <p>We couldn't find "${city}". Please check the spelling and try again.</p>
                        <div class="error-suggestions">
                            <p>Suggestions:</p>
                            <ul>
                                <li>Check for typos</li>
                                <li>Try the full city name</li>
                                <li>Include country code (e.g., "Manila, PH")</li>
                            </ul>
                        </div>
                    </div>
                </div>`;
            return;
        }

        displayWeather(data); 
        addToSearchHistory(city.split(',')[0]); // Store only city name
        
    } catch (error) {
        console.error("Weather Error:", error);
        
        // Reset button
        const searchButton = document.querySelector('.search-button');
        searchButton.innerHTML = '<span class="button-icon">🔍</span><span class="button-text">Search</span>';
        searchButton.disabled = false;
        
        document.getElementById("weatherResult").innerHTML = `
            <div class="weather-card error-card">
                <div class="text-error">
                    <span class="error-icon">⚠️</span>
                    <h3>Connection Error</h3>
                    <p>Unable to fetch weather data. Please check your internet connection and try again.</p>
                </div>
            </div>`;
    }
}

// Enhanced Weather Display
function displayWeather(data) {
    const weatherIcon = data.weather[0].icon;
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const description = data.weather[0].description;
    const pressure = data.main.pressure;
    const visibility = data.visibility / 1000; // Convert to km
    
    // Get weather condition for better styling
    const weatherCondition = getWeatherCondition(data.weather[0].main);
    
    document.getElementById("weatherResult").innerHTML = `
        <div class="weather-card ${weatherCondition}">
            <h3>${data.name}, ${data.sys.country}</h3>
            <div class="weather-info">
                <div class="weather-main">
                    <div class="weather-temp">${temp}°C</div>
                    <div class="weather-description">${description}</div>
                </div>
                <img src="https://openweathermap.org/img/wn/${weatherIcon}@2x.png" alt="Weather Icon" class="weather-icon-img">
            </div>
            <div class="weather-details">
                <div class="weather-detail">
                    <span class="detail-label">Feels like</span>
                    <span class="detail-value">${feelsLike}°C</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-label">Humidity</span>
                    <span class="detail-value">${humidity}%</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-label">Wind Speed</span>
                    <span class="detail-value">${windSpeed} m/s</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-label">Pressure</span>
                    <span class="detail-value">${pressure} hPa</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-label">Visibility</span>
                    <span class="detail-value">${visibility} km</span>
                </div>
            </div>
            <div class="weather-actions">
                <button onclick="refreshWeather()" class="refresh-button">
                    <span class="button-icon">🔄</span>
                    <span class="button-text">Refresh</span>
                </button>
            </div>
        </div>
    `;
}

// Get weather condition for styling
function getWeatherCondition(weatherMain) {
    const conditions = {
        'Clear': 'clear',
        'Clouds': 'cloudy',
        'Rain': 'rainy',
        'Snow': 'snowy',
        'Thunderstorm': 'stormy',
        'Drizzle': 'drizzle',
        'Mist': 'misty',
        'Fog': 'foggy'
    };
    return conditions[weatherMain] || 'default';
}

// Refresh weather data
function refreshWeather() {
    const city = document.getElementById("cityInput").value.trim();
    if (city) {
        getWeather();
    }
}

// Enhanced News Search with Suggestions
async function searchNewsSuggestions(query) {
    if (query.length < 2) return;
    
    try {
        const response = await fetch(`https://gnews.io/api/v4/search?q=${query}&token=${newsApiKey}&lang=en&max=3`);
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            showNewsSuggestions(data.articles, query);
        }
    } catch (error) {
        console.error("News suggestions error:", error);
    }
}

// Show news suggestions
function showNewsSuggestions(articles, query) {
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'news-suggestions';
    suggestionsContainer.innerHTML = `
        <div class="suggestions-header">
            <span>Quick Results for "${query}"</span>
        </div>
        ${articles.map(article => `
            <div class="news-suggestion-item" onclick="selectNewsSuggestion('${article.title.replace(/'/g, "\\'")}')">
                <span class="suggestion-title">${article.title}</span>
                <span class="suggestion-source">${article.source.name}</span>
            </div>
        `).join('')}
    `;
    
    // Insert after news input
    const newsInput = document.getElementById('newsInput');
    const existingSuggestions = document.querySelector('.news-suggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }
    newsInput.parentNode.appendChild(suggestionsContainer);
}

// Select news suggestion
function selectNewsSuggestion(title) {
    document.getElementById('newsInput').value = title;
    document.querySelector('.news-suggestions')?.remove();
    searchNews();
}

// Enhanced News Fetch with Better Error Handling
async function fetchNews(category = "general", query = "") {
    try {
        showLoading("newsContainer"); 
        
        // Update active tab
        updateActiveTab(category);
        
        // Clear any existing news suggestions
        document.querySelector('.news-suggestions')?.remove();
        
        const url = query 
            ? `https://gnews.io/api/v4/search?q=${query}&token=${newsApiKey}&lang=en&max=8`
            : `https://gnews.io/api/v4/top-headlines?category=${category}&token=${newsApiKey}&lang=en&max=8`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (!data.articles || data.articles.length === 0) { 
            document.getElementById("newsContainer").innerHTML = `
                <div class="news-card no-results">
                    <div class="text-center text-muted">
                        <span class="no-results-icon">📰</span>
                        <h3>No News Found</h3>
                        <p>${query ? `No news available for "${query}".` : `No news available for ${category} category.`}</p>
                        <div class="no-results-suggestions">
                            <p>Try:</p>
                            <ul>
                                <li>Different keywords</li>
                                <li>Another category</li>
                                <li>Checking spelling</li>
                            </ul>
                        </div>
                    </div>
                </div>`;
            return;
        }

        displayNews(data.articles); 
        
        // Store search query for news
        if (query) {
            lastSearchQuery = query;
        }
        
    } catch (error) {
        console.error("News Fetch Error:", error);
        document.getElementById("newsContainer").innerHTML = `
            <div class="news-card error-card">
                <div class="text-center text-error">
                    <span class="error-icon">⚠️</span>
                    <h3>Connection Error</h3>
                    <p>Unable to load news. Please check your internet connection and try again.</p>
                </div>
            </div>`;
    }
}

// Update active tab
function updateActiveTab(category) {
    // Remove active class from all tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to current tab
    const activeTab = document.querySelector(`[data-category="${category}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

// Enhanced News Search Function
function searchNews() {
    const query = document.getElementById("newsInput").value.trim();
    if (query) {
        fetchNews("", query);
        // Clear active tab when searching
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Clear suggestions
        document.querySelector('.news-suggestions')?.remove();
    } else {
        showNotification("Please enter a search term.", "warning");
    }
}

// Enhanced News Display with Better Formatting
function displayNews(articles) {
    const newsContainer = document.getElementById("newsContainer");
    newsContainer.innerHTML = "";

    articles.forEach((article, index) => { 
        const newsCard = document.createElement("div");
        newsCard.classList.add("news-card");
        
        // Format date
        const publishDate = new Date(article.publishedAt);
        const formattedDate = publishDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Calculate time ago
        const timeAgo = getTimeAgo(publishDate);
        
        // Truncate description if too long
        const maxDescriptionLength = 150;
        const description = article.description && article.description.length > maxDescriptionLength 
            ? article.description.substring(0, maxDescriptionLength) + '...'
            : article.description || "No description available.";
        
        newsCard.innerHTML = `
            <div class="news-header">
                <h4 class="news-title">${article.title}</h4>
                <div class="news-meta">
                    <span class="news-date">${formattedDate}</span>
                    <span class="news-time-ago">${timeAgo}</span>
                </div>
            </div>
            <p class="news-description">${description}</p>
            <div class="news-footer">
                <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="news-link">
                    Read Full Article
                    <span class="link-icon">→</span>
                </a>
                ${article.source.name ? `<span class="news-source">Source: ${article.source.name}</span>` : ''}
            </div>
        `;
        
        // Add staggered animation
        newsCard.style.animationDelay = `${index * 0.1}s`;
        newsContainer.appendChild(newsCard);
    });
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
}

// Show Loading Spinner
function showLoading(elementId) {
    document.getElementById(elementId).innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p class="loading-text">Loading...</p>
        </div>
    `;
}

// Show notification (polished for accessibility and animation)
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    // Remove any existing notification
    container.innerHTML = '';
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('tabindex', '0');
    notification.style.pointerEvents = 'auto';
    notification.innerText = message;
    container.appendChild(notification);
    notification.focus();
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-30px) translateX(-50%)';
        setTimeout(() => {
            if (container.contains(notification)) container.removeChild(notification);
        }, 400);
    }, 2600);
}

// Add enhanced styles to CSS
const enhancedStyles = `
.suggestions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-muted);
}

.clear-history {
    background: none;
    border: none;
    color: var(--error-color);
    cursor: pointer;
    font-size: 0.75rem;
    padding: var(--spacing-xs);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
}

.clear-history:hover {
    background: var(--error-color);
    color: var(--text-inverse);
}

.history-item {
    background: var(--primary-light);
    border-left: 3px solid var(--primary-color);
}

.suggestion-type {
    font-size: 0.625rem;
    color: var(--primary-color);
    background: var(--primary-light);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-weight: 500;
}

.suggestion-hint {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-style: italic;
}

.loading {
    color: var(--text-muted);
    font-style: italic;
}

.no-results {
    color: var(--text-muted);
    text-align: center;
}

.error {
    color: var(--error-color);
}

.news-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    z-index: 1000;
    margin-top: var(--spacing-xs);
    backdrop-filter: blur(10px);
}

.news-suggestion-item {
    padding: var(--spacing-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.news-suggestion-item:hover {
    background: var(--primary-light);
    transform: translateX(4px);
}

.suggestion-title {
    font-weight: 500;
    color: var(--text-primary);
    flex: 1;
}

.suggestion-source {
    font-size: 0.75rem;
    color: var(--text-muted);
    background: var(--bg-secondary);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
}

.weather-actions {
    margin-top: var(--spacing-lg);
    text-align: center;
}

.refresh-button {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-normal);
    font-size: 0.875rem;
}

.refresh-button:hover {
    background: var(--primary-color);
    color: var(--text-inverse);
    transform: scale(1.05);
}

.news-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--spacing-xs);
}

.news-time-ago {
    font-size: 0.625rem;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
}

.error-card {
    border-color: var(--error-color);
}

.error-card .error-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: var(--spacing-md);
}

.error-suggestions, .no-results-suggestions {
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
}

.error-suggestions ul, .no-results-suggestions ul {
    margin-top: var(--spacing-sm);
    padding-left: var(--spacing-lg);
}

.error-suggestions li, .no-results-suggestions li {
    margin-bottom: var(--spacing-xs);
    color: var(--text-secondary);
}

.weather-card.clear {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
}

.weather-card.cloudy {
    background: linear-gradient(135deg, rgba(100, 113, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.weather-card.rainy {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
}

.weather-card.stormy {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
}

.weather-card.snowy {
    background: linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(107, 114, 128, 0.1) 100%);
}

.weather-card.misty, .weather-card.foggy {
    background: linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(75, 85, 99, 0.1) 100%);
}
`;

// Inject enhanced styles
const enhancedStyleSheet = document.createElement("style");
enhancedStyleSheet.textContent = enhancedStyles;
document.head.appendChild(enhancedStyleSheet);
