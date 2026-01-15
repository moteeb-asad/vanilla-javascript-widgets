# Vanilla JavaScript Widgets

Production-ready, self-contained widgets for sports clubs and community websites. Built with **pure vanilla JavaScript** (ES6+) - no frameworks, no dependencies.

## 🎯 What's Included

A collection of **5 reusable widgets** that integrate seamlessly into any website:

### 📰 **News Widget**

Display club news and announcements with active/archived filtering, search, and category organization. Features date-based auto-filtering and customizable featured items.

### ❓ **FAQ Widget**

Comprehensive FAQ display with dual view modes (list & cards), category filtering, advanced search, and file attachment support. Perfect for handling customer questions.

### 🏑 **Cancelled Matches Carousel**

Beautiful carousel displaying cancelled matches with smooth scrolling navigation, date filtering, and match details. Includes dark mode support.

### 🎖️ **Hockey Matches Schedule Widget**

Interactive widget for displaying and managing hockey match schedules with advanced filtering by category, teams, and location. Features date navigation, detailed match information with standings, and responsive accordion-based display.

### 🤝 **Sponsors Widget**

Elegant sponsor directory with dual view modes (tiles & list), category filtering, search capabilities, and website links. Automatically organized and sorted.

## ✨ Key Features

- ✅ **Zero Dependencies** - Pure JavaScript (ES6+ modules)
- ✅ **Responsive Design** - Works perfectly on desktop and mobile
- ✅ **Dark Mode Support** - Built-in light/dark theme compatibility
- ✅ **Flexible Data** - Connect to APIs or use local JSON data
- ✅ **Highly Configurable** - Easy-to-customize settings for each widget
- ✅ **Search & Filter** - Real-time search and advanced filtering options
- ✅ **Production Ready** - Clean, well-documented, tested code

## 🚀 Quick Start

Each widget is self-contained and requires just 3 files:

```
widget-name/
├── index.html      # HTML structure
├── main.js         # Logic & functionality
├── style.css       # Responsive styling
└── dummyData.js    # Configuration & data
```

### Setup (30 seconds)

1. Copy widget folder to your project
2. Update `dummyData.js` with your data/API endpoint
3. Include in your HTML:

```html
<link rel="stylesheet" href="widget/style.css" />
<script type="module" src="widget/main.js"></script>
```

### Test Locally

```bash
cd widgets/js-news-widget
python -m http.server 8000
# Visit http://localhost:8000
```

## 📁 Project Structure

```
vanilla-javascript-widgets/
├── widgets/
│   ├── js-news-widget/                    # Club news & announcements
│   ├── js-faqs-widget/                    # Frequently asked questions
│   ├── js-cancelled-matches-carousel-widget/  # Match cancellations
│   ├── js-matches-schedules-widget/       # Hockey match schedules
│   └── js-sponsors-widget/                # Sponsor directory
└── README.md
```

## 🔧 Configuration

Each widget uses a centralized `dummyData.js` for configuration:

```javascript
export const data = {
  config: {
    // Display settings
    hide_widget_title: false,
    hide_categories: false,
    show_search_bar: true,

    // Pagination
    total_news_limit: 7,

    // Connect to API or use local data
    api_url: "https://api.example.com/data",
    api_token: "your-token",
  },
  device: "desktop",
};
```

## 💻 Technologies

- **Vanilla JavaScript** (ES6+ modules)
- **HTML5**
- **CSS3** (Grid, Flexbox, Custom Properties)
- **No frameworks** - Just pure JavaScript

## 📊 Browser Support

- ✓ Chrome/Edge (Latest)
- ✓ Firefox (Latest)
- ✓ Safari (Latest)
- ✓ Mobile browsers (iOS Safari, Chrome Mobile)

## 📖 Documentation

Each widget includes detailed documentation:

- [News Widget](widgets/js-news-widget/README.md)
- [FAQ Widget](widgets/js-faqs-widget/README.md)
- [Cancelled Matches Widget](widgets/js-cancelled-matches-carousel-widget/README.md)
- [Hockey Matches Schedule Widget](widgets/js-matches-schedules-widget/README.md)
- [Sponsors Widget](widgets/js-sponsors-widget/README.md)

## 🎨 Customization

All widgets support:

- ✨ Custom color schemes (CSS variables)
- 🔧 Hide/show UI components
- 📱 Mobile-specific configurations
- 🌓 Light & dark mode
- 🔍 Search & filter options
- 📊 Pagination settings

## 📝 Code Quality

- Clear, well-organized code
- Comprehensive inline comments
- Error handling & validation
- Accessibility best practices
- Responsive design patterns

## 📄 License

Portfolio/Educational project

## 🤝 Contributing

Found an issue or have a feature request? Open an issue on GitHub!

## ⭐ Like This Project?

Give it a star! It helps others discover these widgets.
