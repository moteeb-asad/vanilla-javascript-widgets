# Vanilla JavaScript Widgets

A collection of reusable JavaScript widgets built with **vanilla JavaScript** (no frameworks). These widgets can be integrated into any frontend website to display dynamic data by connecting to APIs or data files.

## 🎯 Overview

This repository contains self-contained, production-ready JavaScript widgets that:

- **Work on any frontend**: Easily integrate into any website or web application
- **Connect to data sources**: Fetch data from REST APIs or use local data files
- **Pure JavaScript**: Built with vanilla JavaScript (ES6+) - no dependencies required
- **Responsive & Accessible**: Mobile-friendly designs with dark mode support
- **Easy to customize**: Well-structured code that's simple to modify and extend

## 📦 Widgets

### FAQ Widget (`js-faqs-widget`)

An interactive FAQ widget with dual view modes, search, filtering, and modal popups.

**Features:**

- Dual view modes (List & Cards)
- Real-time search functionality
- Category and attachment filtering
- Expandable accordions
- Modal popups for detailed views
- Responsive design
- Dark mode support

**Data Source:** Connects to API or uses `dummyData.js` file

**Files:**

- `main.js` - Core functionality (1,157 lines)
- `index.html` - HTML structure
- `style.css` - Responsive styling (1,254 lines)
- `dummyData.js` - Sample data structure

### Cancelled Matches Carousel Widget (`js-cancelled-matches-carousel-widget`)

A carousel widget for displaying cancelled sports matches with date filtering.

**Features:**

- Smooth carousel navigation
- Date-based filtering
- Match details display (teams, times, locations, reasons)
- Responsive design
- Dark mode support

**Data Source:** Connects to API or uses `dummyData.js` file

**Files:**

- `main.js` - Core functionality (1,159 lines)
- `index.html` - HTML structure
- `style.css` - Styling with dark mode (471 lines)
- `dummyData.js` - Configuration and sample data

## 🛠️ Technologies Used

- **Vanilla JavaScript** (ES6+)
- **HTML5**
- **CSS3** (Grid, Flexbox, Custom Properties)
- **No frameworks or libraries** (pure JavaScript)

## 📁 Project Structure

```
vanilla-javascript-widgets/
├── widgets/
│   ├── js-faqs-widget/
│   │   ├── index.html
│   │   ├── main.js
│   │   ├── style.css
│   │   ├── dummyData.js
│   │   ├── screenshots/
│   │   └── README.md
│   ├── js-cancelled-matches-carousel-widget/
│   │   ├── index.html
│   │   ├── main.js
│   │   ├── style.css
│   │   ├── dummyData.js
│   │   ├── screenshots/
│   │   └── README.md
│   └── [more widgets...]
└── README.md
```

## 🚀 Getting Started

Each widget is self-contained and can be integrated into any website:

1. **Copy the widget files** to your project
2. **Configure data source**: Update `dummyData.js` with your API endpoint or data
3. **Include in your HTML**: Add the CSS and JavaScript files to your page
4. **Customize**: Modify styles and configuration as needed

### Running Locally

For testing, you can run each widget independently:

```bash
# Navigate to widget folder
cd widgets/js-faqs-widget

# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

## 💡 Data Integration

Widgets can connect to data in two ways:

1. **API Integration**: Configure the API endpoint and authentication token in `dummyData.js`
2. **Local Data File**: Use the `dummyData.js` file to provide static data

Example API configuration:

```javascript
config: {
  api_url: "https://api.example.com/data",
  api_token: "your-api-token"
}
```

## 🛠️ Technologies Used

- **Vanilla JavaScript** (ES6+ modules)
- **HTML5**
- **CSS3** (Grid, Flexbox, Custom Properties)
- **No frameworks or libraries** - pure JavaScript

## 📝 Code Quality

- Clear function naming and organization
- Commented code sections
- Consistent code style
- Error handling and validation
- Responsive and accessible design

## 📄 License

This project is for portfolio/educational purposes.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues) if you want to contribute.

## 📧 Contact

For questions or suggestions, please open an issue or contact the repository maintainer.

## ⭐ Show Your Support

If you find this project helpful, please consider giving it a star ⭐!
