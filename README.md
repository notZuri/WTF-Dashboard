# 🌤️ WTF Dashboard - Weather, Trends & Facts📰

A modern, responsive web application that combines real-time weather forecasting with live news aggregation. Built with vanilla JavaScript and modern CSS, this dashboard demonstrates advanced front-end development skills including API integration, responsive design, and progressive web app features.

📍 **Live Demo**: [https://wtf-dashboard.netlify.app/]  
🛠️ **Tech Stack**: HTML5, CSS3, JavaScript (ES6+)  
🎯 **Focus**: API integration, responsive design, real-time data handling, modern UI/UX

---

## 🔑 Key Features

- 🌤️ **Real-time Weather**: Search any city with instant autocomplete and comprehensive weather data, powered by a local city database for offline-capable searching.
- 📰 **News Aggregation**: Browse news by category or search trending topics
- 🎨 **Responsive Design**: Fully functional on mobile, tablet, desktop
- 🌙 **Theme System**: Dark/light mode with persistent storage
- ✨ **Animated UI**: Dynamic backgrounds, smooth transitions, glassmorphism effects
- ♿ **Accessibility**: Keyboard navigation, ARIA labels, WCAG compliance

---

<details>
<summary>📚 Full Project Documentation</summary>

## 🌤️ Weather Module

- **Real-time Weather Data**: Get current weather conditions for any city worldwide
- **Smart Search System**: Instant autocomplete powered by a local city database
- **Comprehensive Weather Info**: Temperature, humidity, wind speed, pressure, visibility
- **Dynamic Weather Styling**: Condition-based visual themes (sunny, rainy, stormy, etc.)
- **Error Handling**: Graceful fallbacks for invalid cities and network issues
- **Refresh Functionality**: Update weather data with one click

## 📰 News Aggregation

- **Multi-Category Support**: General, Technology, Sports, Business, and Health news
- **Advanced Search**: Real-time search suggestions and filtering
- **Rich Content Display**: Article previews with timestamps and source attribution
- **External Linking**: Direct access to full articles with proper security attributes
- **Time-based Display**: "Time ago" indicators for recent articles

## 🎨 User Experience & Design

- **Responsive Design**: Mobile-first approach with breakpoints for all device sizes
- **Dark/Light Theme**: Persistent theme switching with localStorage
- **Animated Background**: Dynamic sun, rain, and cloud animations
- **Accessibility**: WCAG-compliant with keyboard navigation and ARIA labels
- **Modern UI/UX**: Glassmorphism effects, smooth transitions, and micro-interactions
- **Loading States**: Spinners and progress indicators for better UX

## ⚡ Performance & Technical Excellence

- **Vanilla JavaScript**: No frameworks - pure ES6+ with modern async/await patterns
- **Optimized Performance**: Debounced search, efficient DOM manipulation
- **Progressive Enhancement**: Works without JavaScript for basic functionality
- **Cross-Browser Compatibility**: Tested across modern browsers
- **Clean Architecture**: Modular code structure with separation of concerns

---

## 🛠️ Technologies Used

### Frontend:
- **HTML5**: Semantic markup and accessibility features
- **CSS3**: Custom properties, Flexbox, Grid, animations
- **JavaScript (ES6+)**: Async/await, modules, modern syntax

### APIs & Services:
- **OpenWeatherMap API**: Real-time weather data
- **GNews API**: Latest news articles
- **Local Storage**: User preferences and search history
- **Local City Data**: Instant city suggestions for the search bar

### Design & UX:
- **Responsive Design**: Mobile-first approach
- **CSS Animations**: Hardware-accelerated transitions
- **Accessibility**: ARIA labels, keyboard navigation
- **Modern UI**: Glassmorphism, smooth interactions

---

## 📁 Folder Structure

```
API Project/
├── index.html         # Main HTML file with semantic structure
├── style.css          # Custom CSS with CSS variables and animations
├── script.js          # JavaScript logic with ES6+ features
├── philippine-cities.js # Local data for city autocomplete
├── API-logo.png       # Project logo and branding
├── sky.jpg            # Background asset
└── README.md          # Project documentation
```