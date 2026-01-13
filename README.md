# Duda JavaScript Widgets

A collection of custom JavaScript widgets built with **vanilla JavaScript** (no frameworks). These widgets demonstrate modern JavaScript practices, DOM manipulation, event handling, and component architecture.

## 🎯 Purpose

This repository showcases vanilla JavaScript development skills, including:

- ES6+ features (modules, arrow functions, destructuring)
- DOM manipulation and dynamic content generation
- Event handling and state management
- Component-based architecture
- Responsive design implementation
- Code organization and maintainability

## 📦 Widgets

### FAQ Widget (`js-faqs-widget`)

An interactive FAQ widget with advanced features:

**Features:**

- Dual view modes (List & Cards)
- Real-time search functionality
- Category and attachment filtering
- Expandable accordions
- Modal popups for detailed views
- Responsive design
- Dark mode support
- Configurable display options

**Technical Highlights:**

- **1,149 lines** of well-organized vanilla JavaScript
- Dynamic DOM element creation
- Event delegation and state management
- SVG icon generation
- HTML content parsing and sanitization
- Date formatting utilities
- Modular function structure

**Files:**

- `main.js` - Core functionality (1,149 lines)
- `index.html` - HTML structure
- `style.css` - Responsive styling (1,186 lines)
- `dummyData.js` - Sample data structure

## 🛠️ Technologies Used

- **Vanilla JavaScript** (ES6+)
- **HTML5**
- **CSS3** (Grid, Flexbox, Custom Properties)
- **No frameworks or libraries** (pure JavaScript)

## 📁 Project Structure

```
duda-javascript-widgets/
├── widgets/
│   ├── js-faqs-widget/
│   │   ├── index.html
│   │   ├── main.js
│   │   ├── style.css
│   │   ├── dummyData.js
│   │   └── README.md
│   └── [other widgets...]
└── README.md
```

## 🚀 Getting Started

Each widget is self-contained and can be run independently:

1. Navigate to a widget folder
2. Open `index.html` in a browser
3. Or use a local server:

   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve
   ```

## 💡 Key JavaScript Concepts Demonstrated

- **ES6 Modules**: Import/export functionality
- **DOM API**: QuerySelector, createElement, appendChild
- **Event Handling**: addEventListener, event delegation
- **State Management**: Global state objects
- **Array Methods**: map, filter, forEach, reduce
- **Template Literals**: Dynamic string generation
- **Arrow Functions**: Modern function syntax
- **Destructuring**: Object and array destructuring
- **Optional Chaining**: Safe property access (`?.`)

## 📝 Code Quality

- Clear function naming and organization
- Commented code sections
- Consistent code style
- Error handling and validation
- Responsive and accessible design

## 📄 License

This project is for portfolio/educational purposes.
