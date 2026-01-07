# FAQ Widget

A comprehensive, interactive FAQ (Frequently Asked Questions) widget built with vanilla JavaScript. This widget provides an elegant way to display and manage FAQs with multiple viewing options, filtering capabilities, and customizable display settings.

## Overview

The FAQ Widget is designed to help users easily find answers to common questions. It features:

- **Dual View Modes**: Switch between List view and Cards view
- **Advanced Filtering**: Filter FAQs by category and attachments
- **Search Functionality**: Real-time search through FAQ questions
- **Category Grouping**: FAQs are automatically organized by category
- **Expandable Accordions**: Click to expand/collapse FAQ details
- **Download Support**: Display and download attachments (documents and images)
- **Responsive Design**: Optimized for desktop and mobile devices
- **Customizable Display**: Configurable options for dark mode, search bar visibility, and metadata display

## Features

### View Modes

- **List View**: Traditional accordion-style list with expandable FAQ items
- **Cards View**: Grid-based card layout with modal popup for detailed view

### Filtering & Search

- **Category Filtering**: Filter FAQs by one or multiple categories
- **Attachment Filter**: Show only FAQs with downloadable attachments
- **Search Bar**: Real-time search by question title
- **Clear All**: Reset all filters with a single click

### FAQ Display

- **Category Accordions**: Collapsible category sections showing FAQ count
- **Expandable Content**: Click individual FAQs to view full details
- **Rich Content**: Support for HTML content in FAQ descriptions
- **Metadata Display**: Shows creation date, update date, and author (configurable)
- **Download Links**: Direct links to attached documents and images

### Customization Options

- Dark mode support
- Hide/show search bar
- Hide/show creation date
- Hide/show update date
- Hide/show author information
- Default view mode (desktop/mobile)
- Auto-expand categories option

## Folder Structure

```
js-faqs-widget/
├── index.html          # Main HTML structure and layout
├── main.js            # JavaScript logic and functionality (1149 lines)
├── style.css          # CSS styling and responsive design (1186 lines)
├── dummyData.js       # Sample data structure and configuration
└── README.md          # This documentation file
```

### File Descriptions

#### `index.html`

The main HTML file containing:

- Widget container structure
- Header with view toggle buttons (List/Cards)
- Filter dropdown with category checkboxes
- Search bar input
- List view panel with accordion structure
- Cards view panel with grid layout
- Modal container for card view details
- No results message container

#### `main.js`

The core JavaScript file (1149 lines) containing:

- **Data Management**: FAQ data processing and grouping
- **View Toggle**: Switching between List and Cards views
- **Filter System**: Category and attachment filtering logic
- **Search Functionality**: Real-time search implementation
- **Rendering Functions**: Dynamic HTML generation for both views
- **Modal Management**: Card view modal open/close functionality
- **Configuration Handling**: Duda Content Editor options
- **Helper Functions**: Date formatting, SVG creation, etc.

#### `style.css`

Comprehensive styling file (1186 lines) including:

- CSS custom properties (variables)
- Grid system for responsive layouts
- Accordion animations and transitions
- Dark mode styles
- Modal styling
- Responsive breakpoints (mobile, tablet, desktop)
- Component-specific styles (buttons, inputs, cards, etc.)

#### `dummyData.js`

Sample data structure showing:

- FAQ items with all properties
- Configuration options
- Device detection
- Example category structure
- Asset/attachment examples

## Data Structure

The widget expects data in the following format:

```javascript
{
  config: {
    faqs_list: [
      {
        id: "2001",
        title: "FAQ Question Title",
        description: "<p>HTML content...</p>",
        category_title: "Category Name",
        category_id: 698,
        category_subtitle: null,
        created_at: "2024-12-19T03:10:47Z",
        updated_at: "2025-03-12T19:38:16Z",
        author: "Author Name",
        assets: [
          {
            url: "https://...",
            caption: "File Name",
            type: "document" | "image",
            mimetype: "application/pdf"
          }
        ]
      }
    ],
    dark_mode: false,
    default_desktop_view: "list" | "cards",
    default_mobile_view: "list" | "cards",
    hide_search_bar: false,
    hide_created_at: false,
    hide_updated_at: false,
    hide_author: false,
    collapse_categories: false
  },
  device: "desktop" | "mobile"
}
```

## Usage

1. **Include the files** in your HTML:

   ```html
   <link rel="stylesheet" href="style.css" />
   <script src="main.js" type="module"></script>
   ```

2. **Provide data** via `dummyData.js` or your data source:

   ```javascript
   import { data } from "./dummyData.js";
   ```

3. **Initialize the widget** - The widget automatically initializes on page load.

## Configuration Options

| Option                 | Type    | Default  | Description                                  |
| ---------------------- | ------- | -------- | -------------------------------------------- |
| `dark_mode`            | boolean | `false`  | Enable dark mode styling                     |
| `default_desktop_view` | string  | `"list"` | Default view for desktop ("list" or "cards") |
| `default_mobile_view`  | string  | `"list"` | Default view for mobile ("list" or "cards")  |
| `hide_search_bar`      | boolean | `false`  | Hide the search input field                  |
| `hide_created_at`      | boolean | `false`  | Hide creation date from FAQ items            |
| `hide_updated_at`      | boolean | `false`  | Hide update date from FAQ items              |
| `hide_author`          | boolean | `false`  | Hide author name from FAQ items              |
| `collapse_categories`  | boolean | `false`  | Auto-expand all category accordions          |

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features required
- CSS Grid and Flexbox support needed

## Dependencies

- **Google Fonts**: Inter font family (loaded via CDN)
- **No external JavaScript libraries** required (vanilla JS)

## Notes

- The widget uses ES6 modules (`type="module"`)
- SVG icons are generated dynamically via JavaScript
- All styling is scoped to `.lx-faq-main-wrap` to prevent conflicts
- The widget is designed to work within the Duda platform but can be used standalone
