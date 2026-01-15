import { data } from "./dummyData.js";

// ---------- GLOBAL VARIABLES ---------- //

// *** CONFIGURATION VARIABLES ***
let device = data.device;
let total_news_limit = data.config.total_news_limit || 10;
let news_items_to_show_with_view_all_button =
  data.config.news_items_to_show_with_view_all_button || 6;
let news_placeholder_image = data.config.news_placeholder_image;

// *** WIDGET DISPLAY SETTINGS ***
let hide_widget_outer_lines = data.config.hide_widget_outer_lines;
let hide_widget_title = data.config.hide_widget_title;
let hide_widget_subtitle = data.config.hide_widget_subtitle;
let show_header_buttons = data.config.show_header_buttons;
let show_search_bar = data.config.show_search_bar;
let hide_categories = data.config.hide_categories;
let hide_all_news_bottom_button = data.config.hide_all_news_bottom_button;

// *** FEATURED ITEMS CONFIGURATION ***
let no_of_featured_items_on_mobile = data.config.no_of_featured_items_on_mobile;
if (no_of_featured_items_on_mobile === undefined) {
  no_of_featured_items_on_mobile = 2; // Default to 2 if undefined
}

// *** NEWS STATE VARIABLES ***
let news_list = [];
let currentDisplayedNews = [];
let isShowingAllNews = false;
let currentNewsState = "active";

// ---------------SELECTORS--------------- //

//const newsWidgetWrap = document.querySelector(".news-widget-wrap");
const search_input = document.querySelector(".news-widget-wrap .search-input");
const active_archive_wrap = document.querySelector(".active-archive-wrap");
const active_archive_buttons = document.querySelectorAll(
  ".active-archive-wrap .custom-btn"
);
const view_all_news_btn = document.querySelector(".view-all-news-btn");
const categoriesDropdownWrap = document.querySelector(
  ".categories-dropdown-wrap"
);
const dropdownBtn = categoriesDropdownWrap?.querySelector(
  ".categories-dropdown-btn"
);
const dropdownItems = categoriesDropdownWrap?.querySelector(
  ".categories-dropdown-items-wrap"
);

// ---------------EVENT LISTENERS--------------- //

view_all_news_btn.addEventListener("click", function handleViewAllNews() {
  isShowingAllNews = !isShowingAllNews;

  // Add styling classes if not already present
  view_all_news_btn.classList.add(
    "view-all-button-text-styling",
    "view-all-bg-color",
    "view-all-border-color"
  );

  // Update button content
  view_all_news_btn.innerHTML = "";

  if (isShowingAllNews) {
    // Add left arrow and text for "show less"
    const leftArrow = createArrowSvg();
    leftArrow.style.transform = "rotate(180deg)";
    view_all_news_btn.appendChild(leftArrow);
    view_all_news_btn.appendChild(document.createTextNode(" Show less"));
  } else {
    // Add text and right arrow for "view all"
    view_all_news_btn.appendChild(
      document.createTextNode(`View all news (${news_list.length})`)
    );
    view_all_news_btn.appendChild(document.createTextNode(" "));
    view_all_news_btn.appendChild(createArrowSvg());
  }

  // Render appropriate number of news items
  handleNewsPagination(currentDisplayedNews, currentNewsState);
});

active_archive_buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Remove all state classes from all buttons
    active_archive_buttons.forEach((button) => {
      // Remove active state
      button.classList.remove("active");
      // Switch to normal styling
      button.classList.remove("active-btn-bg-color", "active-btn-border-color");
      button.classList.add("normal-btn-bg-color", "normal-btn-border-color");
    });

    // Add active state to clicked button
    btn.classList.add("active");
    // Switch to active styling
    btn.classList.remove("normal-btn-bg-color", "normal-btn-border-color");
    btn.classList.add("active-btn-bg-color", "active-btn-border-color");

    const currentDate = new Date();
    let filteredList;

    // Update current state
    currentNewsState = btn.dataset.name;

    // Update header text
    updateHeaderLayout();

    // Filter based on active/archived state
    filteredList = filterNewsByDate(news_list, currentNewsState === "active");

    // Update categories for the new state
    renderCategoriesButtons();
    createCategoriesInDropdown();

    // Update news list
    handleNewsPagination(filteredList, currentNewsState);
  });
});

search_input.addEventListener("input", () => {
  const search_value = search_input.value.trim();
  const newsGridWrap = document.querySelector(".news-grid-wrap");

  // Reset view all state when searching
  isShowingAllNews = false;

  // Always filter by active state when header buttons are hidden
  // Otherwise, filter by current state
  let stateFilteredNews =
    show_header_buttons === false
      ? filterNewsByDate(news_list, true)
      : filterNewsByDate(news_list, currentNewsState === "active");

  if (search_value === "") {
    // If search is empty, show all news for current state
    newsGridWrap.classList.remove("no-results-wrap");
    handleNewsPagination(stateFilteredNews, currentNewsState);
    return;
  }

  const filteredNews = stateFilteredNews.filter(
    (news) =>
      news.title.toLowerCase().includes(search_value.toLowerCase()) ||
      news.introtext?.toLowerCase().includes(search_value.toLowerCase())
  );

  if (filteredNews.length === 0) {
    newsGridWrap.classList.add("no-results-wrap");

    // Show no results message
    showNoResults(
      newsGridWrap,
      `No ${
        currentNewsState === "active" ? "active" : "archived"
      } articles found`
    );

    // Hide view all button when no results
    view_all_news_btn.style.display = "none";
  } else {
    newsGridWrap.classList.remove("no-results-wrap");
    handleNewsPagination(filteredNews, currentNewsState);
  }
});

dropdownBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // Prevent event from bubbling up
  const isVisible = dropdownItems.style.display === "block";
  dropdownItems.style.display = isVisible ? "none" : "block";

  // If opening dropdown, ensure the current category is marked as active
  if (!isVisible) {
    const currentCategory = dropdownBtn.querySelector("span").textContent;
    dropdownItems.querySelectorAll(".single-dropdown-item").forEach((item) => {
      item.classList.toggle("active", item.textContent === currentCategory);
    });
  }
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!categoriesDropdownWrap.contains(e.target)) {
    dropdownItems.style.display = "none";
  }
});

// ---------------FUNCTIONS--------------- //

// ** FETCH NEWS **

async function fetchNews() {
  try {
    const collectionData = data?.config?.listNews;
    if (collectionData.length === 0) {
      console.log("No news items found");
      configureNewsWidgetVisibility(collectionData, currentNewsState);
      return;
    }

    // Reset view all state
    isShowingAllNews = false;

    // Load news list
    news_list = collectionData.slice(0, total_news_limit);

    // When header buttons are hidden
    if (show_header_buttons === false) {
      // Hide active/archive buttons
      if (active_archive_wrap) {
        active_archive_wrap.style.display = "none";
      }
      // Set initial header text
      updateHeaderLayout();
      // Render categories first
      renderCategoriesButtons();
      createCategoriesInDropdown();
      // Show only active news
      const activeNews = filterNewsByDate(news_list, true);
      handleNewsPagination(activeNews, "active");
      return;
    }

    // Normal flow when header buttons are shown
    news_list = collectionData.slice(0, total_news_limit);

    // Show active/archive buttons
    if (active_archive_wrap) {
      active_archive_wrap.style.display = "block";
    }

    // Set initial header text
    updateHeaderLayout();

    // First render categories since they depend on news_list
    renderCategoriesButtons();
    createCategoriesInDropdown(); // Add mobile dropdown categories

    // Trigger click on active button by default
    const activeButton = document.querySelector('[data-name="active"]');
    if (activeButton) {
      activeButton.click();
    }
  } catch (error) {
    console.error("Error fetching collection:", error);
  }
}

// ** UPDATE HEADER LAYOUT AND VISIBILITY **

function updateHeaderLayout() {
  const mainHeading = document.querySelector(".main-heading");
  const descWrap = document.querySelector(".desc-wrap");

  // Handle heading visibility with proper boolean checks
  mainHeading.style.display = hide_widget_title === true ? "none" : "block";
  descWrap.style.display = hide_widget_subtitle === true ? "none" : "block";

  if (currentNewsState === "active") {
    mainHeading.textContent =
      data.config.active_widget_title || "Laatste Nieuws";
    descWrap.textContent =
      data.config.active_widget_subtitle ||
      "Stay up to date with the latest club news and announcements";
  } else {
    mainHeading.textContent =
      data.config.archived_widget_title || "Gearchiveerd Nieuws";
    descWrap.textContent =
      data.config.archived_widget_subtitle ||
      "View archived news articles and previous announcements";
  }

  // Handle search bar visibility
  const searchBarOuterWrap = document.querySelector(".search-bar-outer-wrap");
  searchBarOuterWrap.style.display = show_search_bar ? "block" : "none";

  // Handle Header Wrapper ( Both headings and active/archive buttons) visibility
  const headingsWrap = document.querySelector(".headings-wrap");
  if (
    show_header_buttons === false &&
    hide_widget_title === true &&
    hide_widget_subtitle === true
  ) {
    headingsWrap.style.display = "none";
  } else {
    headingsWrap.style.display = "flex";
  }
}

// ** RENDER NEWS TO DOM **

function renderNewsToDom(news_list) {
  const newsWidgetWrap = document.querySelector(".news-widget-wrap");
  const newsGridWrap = document.querySelector(".news-grid-wrap");
  if (newsWidgetWrap) newsWidgetWrap.style.display = "block";
  if (!newsGridWrap) {
    console.warn("News grid wrapper not found");
    return;
  }

  // Clear the container
  newsGridWrap.innerHTML = "";

  // Helper function to create SVG icons
  function createSvgIcon(type, paths) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const attrs = {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: `lucide lucide-${type} ${
        type === "calendar"
          ? "date-icon-color h-3 w-3 mr-1"
          : "read-more-icon-color h-3 w-3 ml-1"
      }`,
      "aria-hidden": "true",
    };

    Object.entries(attrs).forEach(([key, value]) =>
      svg.setAttribute(key, value)
    );
    paths.forEach((d) => {
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute("d", d);
      svg.appendChild(path);
    });

    return svg;
  }

  // Process each news item
  news_list.forEach((newsItem) => {
    if (!newsItem) return;

    // Create main structure
    const newsLink = document.createElement("a");
    const newsElement = document.createElement("div");
    const imgWrap = document.createElement("div");
    const contentWrap = document.createElement("div");

    // Set main attributes
    newsLink.href = newsItem.lnkWebsite || "#";

    // Handle featured class based on no_of_featured_items_on_mobile value
    let isFeatured = false;
    if (no_of_featured_items_on_mobile === "all") {
      isFeatured = true; // Make all items featured
    } else if (no_of_featured_items_on_mobile === 0) {
      isFeatured = false; // Make all items not featured
    } else if (no_of_featured_items_on_mobile > 0) {
      const itemIndex = news_list.indexOf(newsItem);
      isFeatured = itemIndex < no_of_featured_items_on_mobile; // Feature first n items
    }
    // If no_of_featured_items_on_mobile is 0, no items will be featured
    newsLink.className = `news-card-border-color news-grid-item-link${
      isFeatured ? " featured" : ""
    }`;
    newsElement.className = "news-grid-item";
    imgWrap.className = "img-wrap";
    contentWrap.className = "content-wrap";

    // Add image
    const img = document.createElement("img");
    img.src = newsItem.homepage_image || news_placeholder_image || "";
    img.alt = newsItem.title || "News image";
    imgWrap.appendChild(img);

    // Create category and date section
    const categoryDateWrap = document.createElement("div");
    categoryDateWrap.className = "category-date-wrap";

    // Add category
    const categoryWrap = document.createElement("div");
    categoryWrap.className =
      "category-wrap category-text-styling category-text-bg-color category-text-border-color";
    categoryWrap.textContent = newsItem.categories || "Other";

    // Add date with calendar icon
    const dateWrap = document.createElement("div");
    dateWrap.className = "date-wrap date-text-styling";

    const calendarSvg = createSvgIcon("calendar", [
      "M8 2v4",
      "M16 2v4",
      "M3 10h18",
      "M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z",
    ]);

    const dateText = document.createElement("span");
    dateText.className = "date-text";
    // Use short date format for non-featured items on mobile
    const useShortFormat = device === "mobile" && !isFeatured;
    dateText.textContent = newsItem.starts_at_date
      ? formatDate(newsItem.starts_at_date, useShortFormat)
      : "";

    dateWrap.append(calendarSvg, dateText);
    categoryDateWrap.append(categoryWrap, dateWrap);

    // Add title
    const title = document.createElement("h3");
    title.className = "title-wrap news-title-styling";
    title.textContent = newsItem.title || "Untitled";

    // Add description
    const desc = document.createElement("div");
    desc.className = "desc-wrap news-desc-styling";
    desc.innerHTML =
      newsItem.introtext?.length > 110
        ? newsItem.introtext.slice(0, 110) + "..."
        : newsItem.introtext || "";

    // Add read more with arrow
    const readMore = document.createElement("div");
    readMore.className = "read-more-wrap read-more-text-styling";
    readMore.textContent = "Read more";

    const arrowSvg = createSvgIcon("arrow-right", [
      "M5 12h14",
      "m12 5 7 7-7 7",
    ]);
    readMore.appendChild(arrowSvg);

    // Assemble everything
    contentWrap.append(categoryDateWrap, title, desc, readMore);
    newsElement.append(imgWrap, contentWrap);
    newsLink.appendChild(newsElement);
    newsGridWrap.appendChild(newsLink);
  });
}

// ** HANDLE NEWS PAGINATION **

function handleNewsPagination(newsToRender, currentNewsState) {
  configureNewsWidgetVisibility(newsToRender, currentNewsState);
  if (!Array.isArray(newsToRender) || newsToRender.length === 0) {
    console.warn("No news items to render");
    return;
  }

  currentDisplayedNews = newsToRender; // Store for reference

  // When hide_all_news_bottom_button is true, show all news
  // Otherwise use normal pagination logic
  const itemsToShow = hide_all_news_bottom_button
    ? newsToRender.length
    : isShowingAllNews
    ? newsToRender.length
    : Math.min(news_items_to_show_with_view_all_button, newsToRender.length);

  // Get the items to display for current page
  const displayItems = newsToRender.slice(0, itemsToShow);

  // Render the visible items
  renderNewsToDom(displayItems);

  // Update view-all button visibility and content
  if (newsToRender.length > news_items_to_show_with_view_all_button) {
    view_all_news_btn.style.display = "block";
    // Add styling classes if not already present
    view_all_news_btn.classList.add(
      "view-all-button-text-styling",
      "view-all-bg-color",
      "view-all-border-color"
    );
    view_all_news_btn.innerHTML = "";

    if (isShowingAllNews) {
      // Add left arrow and text for "show less"
      const leftArrow = createArrowSvg();
      leftArrow.style.transform = "rotate(180deg)";
      view_all_news_btn.appendChild(leftArrow);
      view_all_news_btn.appendChild(document.createTextNode(" Show less"));
    } else {
      // Add text and right arrow for "view all"
      view_all_news_btn.appendChild(
        document.createTextNode(`View all news (${newsToRender.length})`)
      );
      view_all_news_btn.appendChild(document.createTextNode(" "));
      view_all_news_btn.appendChild(createArrowSvg());
    }
  } else {
    view_all_news_btn.style.display = "none";
  }
}

// ** RENDER CATEGORIES BUTTONS **

function renderCategoriesButtons() {
  const categoriesButtonsWrap = document.querySelector(
    ".categories-buttons-wrap"
  );
  categoriesButtonsWrap.innerHTML = "";
  categoriesButtonsWrap.appendChild(createCategoriesButtons());
}

// ** CREATE CATEGORIES BUTTONS **

function createCategoriesButtons() {
  // Create inner wrap for buttons
  const buttonsInnerWrap = document.createElement("div");
  buttonsInnerWrap.className = "categories-buttons-inner-wrap";

  // Always filter by active state when header buttons are hidden
  // Otherwise, filter by current state
  const newsToUse =
    show_header_buttons === false
      ? filterNewsByDate(news_list, true)
      : filterNewsByDate(news_list, currentNewsState === "active");

  // Get categories that have items
  const categoriesWithItems = new Set();
  let hasOther = false;

  newsToUse.forEach((item) => {
    if (!item.categories || item.categories === "Other") {
      hasOther = true;
    } else {
      categoriesWithItems.add(item.categories);
    }
  });

  // Create final categories array, with "All" first and "Other" last if it exists
  const categories = ["All"];
  const sortedCategories = Array.from(categoriesWithItems).sort();
  categories.push(...sortedCategories);
  if (hasOther) {
    categories.push("Other");
  }

  // Create buttons for each category
  categories.forEach((category) => {
    if (!category) return; // Skip if category is undefined

    const button = document.createElement("button");
    const isAll = category === "All";
    button.className = `category-btn ${
      isAll ? "active" : ""
    } category-btn-text-styling category-${
      isAll ? "active" : "normal"
    }-btn-bg-color category-${isAll ? "active" : "normal"}-btn-border-color`;
    button.setAttribute("data-name", isAll ? "all" : category.toLowerCase());
    button.textContent = category === "All" ? "All" : category;

    // Add click event listener
    button.addEventListener("click", (e) => {
      // Remove active class from all buttons
      document.querySelectorAll(".category-btn").forEach((btn) => {
        btn.classList.remove("active");
        btn.classList.remove(
          "category-active-btn-bg-color",
          "category-active-btn-border-color"
        );
        btn.classList.add(
          "category-normal-btn-bg-color",
          "category-normal-btn-border-color"
        );
      });

      // Add active class to clicked button
      e.target.classList.add("active");
      e.target.classList.remove(
        "category-normal-btn-bg-color",
        "category-normal-btn-border-color"
      );
      e.target.classList.add(
        "category-active-btn-bg-color",
        "category-active-btn-border-color"
      );
      // Filter news based on category and current state
      const selectedCategory = e.target.getAttribute("data-name");

      // Always filter by active state when header buttons are hidden
      // Otherwise, filter by current state
      let stateFilteredNews =
        show_header_buttons === false
          ? filterNewsByDate(news_list, true)
          : filterNewsByDate(news_list, currentNewsState === "active");

      // Then filter by category
      let filteredNews;
      if (selectedCategory === "all") {
        filteredNews = stateFilteredNews;
      } else if (selectedCategory === "other") {
        filteredNews = stateFilteredNews.filter(
          (item) => !item.categories || item.categories === "Other"
        );
      } else {
        filteredNews = stateFilteredNews.filter((item) => {
          if (!item || !item.categories) return false;
          return item.categories.toLowerCase() === selectedCategory;
        });
      }

      // Reset view all state when selecting "All"
      if (selectedCategory === "all") {
        isShowingAllNews = false;
      }

      // Re-render news grid with filtered items
      handleNewsPagination(filteredNews, currentNewsState);
    });

    buttonsInnerWrap.appendChild(button);
  });

  return buttonsInnerWrap;
}

// ** RENDER CATEGORIES IN DROPDOWN **

function createCategoriesInDropdown() {
  const categoriesDropdownWrap = document.querySelector(
    ".categories-dropdown-wrap"
  );
  const dropdownBtn = categoriesDropdownWrap.querySelector(
    ".categories-dropdown-btn"
  );
  const dropdownItems = categoriesDropdownWrap.querySelector(
    ".categories-dropdown-items-wrap"
  );
  const dropdownBtnText = dropdownBtn.querySelector("span");

  // Clear existing items
  dropdownItems.innerHTML = "";

  // Always filter by active state when header buttons are hidden
  // Otherwise, filter by current state
  const newsToUse =
    show_header_buttons === false
      ? filterNewsByDate(news_list, true)
      : filterNewsByDate(news_list, currentNewsState === "active");

  // Get categories that have items
  const categoriesWithItems = new Set();
  let hasOther = false;

  newsToUse.forEach((item) => {
    if (!item.categories || item.categories === "Other") {
      hasOther = true;
    } else {
      categoriesWithItems.add(item.categories);
    }
  });

  // Create final categories array, with "All" first and "Other" last if it exists
  const categories = ["All"];
  const sortedCategories = Array.from(categoriesWithItems).sort();
  categories.push(...sortedCategories);
  if (hasOther) {
    categories.push("Other");
  }

  // Create dropdown items
  categories.forEach((category) => {
    if (!category) return;

    const item = document.createElement("div");
    item.className = `single-dropdown-item${
      category === "All" ? " active" : ""
    }`;
    item.textContent = category;
    item.setAttribute("data-category", category);

    // Add click handler
    item.addEventListener("click", () => {
      // First remove active class from all items
      dropdownItems
        .querySelectorAll(".single-dropdown-item")
        .forEach((dropdownItem) => {
          dropdownItem.classList.remove("active");
        });

      // Then add active class to clicked item
      item.classList.add("active");

      // Update button text
      dropdownBtnText.textContent = category;

      // Hide dropdown
      dropdownItems.style.display = "none";

      // Always filter by active state when header buttons are hidden
      // Otherwise, filter by current state
      let stateFilteredNews =
        show_header_buttons === false
          ? filterNewsByDate(news_list, true)
          : filterNewsByDate(news_list, currentNewsState === "active");
      let filteredNews;

      if (category === "All") {
        filteredNews = stateFilteredNews;
      } else if (category === "Other") {
        filteredNews = stateFilteredNews.filter(
          (item) => !item.categories || item.categories === "Other"
        );
      } else {
        filteredNews = stateFilteredNews.filter(
          (item) => item.categories === category
        );
      }

      // Reset view all state when selecting "All"
      if (category === "All") {
        isShowingAllNews = false;
      }

      // Re-render news grid with filtered items
      handleNewsPagination(filteredNews, currentNewsState);
    });

    dropdownItems.appendChild(item);
  });

  // No need to add event listeners here as they're now defined at the top level
}

// ** FORMAT NEWS DATE **

function formatDate(dateString, useShortFormat = false) {
  if (!dateString) return "Unknown date";

  // Ensure the date format is DD-MM-YYYY
  const dateParts = dateString.split("-");
  if (dateParts.length !== 3) return "Invalid date"; // Invalid format

  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // Months are 0-indexed
  const year = parseInt(dateParts[2], 10);

  const date = new Date(year, month, day);

  // Use short format for non-featured items on mobile
  if (useShortFormat) {
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ** CREATE ARROW SVG **

function createArrowSvg() {
  const arrowSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  arrowSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  arrowSvg.setAttribute("width", "24");
  arrowSvg.setAttribute("height", "24");
  arrowSvg.setAttribute("viewBox", "0 0 24 24");
  arrowSvg.setAttribute("fill", "none");
  arrowSvg.setAttribute("stroke", "currentColor");
  arrowSvg.setAttribute("stroke-width", "2");
  arrowSvg.setAttribute("stroke-linecap", "round");
  arrowSvg.setAttribute("stroke-linejoin", "round");
  arrowSvg.setAttribute("class", "lucide lucide-arrow-right h-4 w-4");
  arrowSvg.setAttribute("aria-hidden", "true");

  // Create and add the paths
  const paths = [
    "M5 12h14", // Horizontal line
    "m12 5 7 7-7 7", // Arrow head
  ];

  paths.forEach((d) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    arrowSvg.appendChild(path);
  });

  return arrowSvg;
}

// ** SHOW NO RESULTS **

function showNoResults(container, message) {
  // Get the template div
  const template = document.getElementById("no-results-template");
  const noResults = template.cloneNode(true);
  noResults.style.display = "block";

  // Update the message and description
  noResults.querySelector(".no-results-heading").textContent = message;
  noResults.querySelector(
    ".no-results-description"
  ).textContent = `Try adjusting your search or filter criteria${
    currentNewsState === "active"
      ? ", or view archived news"
      : ", or switch to active news"
  }`;

  // Clear and update container
  container.innerHTML = "";
  container.appendChild(noResults);
}

// ** FILTER NEWS BY DATE **

function filterNewsByDate(items, isActive) {
  // When state is "all", return all items without filtering
  if (isActive === "all") {
    return items;
  }
  // When header buttons are hidden, always show active news
  if (show_header_buttons === false) {
    isActive = true;
  }

  const currentDate = new Date();
  return items.filter((item) => {
    const endsAtDate = item.ends_at_date;
    const endsAtTime = item.ends_at_time;

    if (!endsAtDate || !endsAtTime) return false;

    const [day, month, year] = endsAtDate.split("-");
    const dateTimeString = `${year}-${month}-${day} ${endsAtTime}`;
    const endsAt = new Date(dateTimeString);

    return isActive ? endsAt >= currentDate : endsAt < currentDate;
  });
}

function configureNewsWidgetVisibility(newsItems, tabname) {
  // Query all required DOM elements
  const elements = {
    noNewsTextWrap: document.querySelector(".no-news-text-wrap"),
    newsGridWrap: document.querySelector(".news-grid-wrap"),
    viewAllNewsBtn: document.querySelector(".view-all-news"),
    searchWrap: document.querySelector(".search-wrap"),
    categoriesButtonsWrap: document.querySelector(".categories-buttons-wrap"),
    categoriesDropdownWrap: document.querySelector(".categories-dropdown-wrap"),
    newsWidgetWrap: document.querySelector(".news-widget-wrap"),
  };

  // Handle widget outer lines
  if (elements.newsWidgetWrap) {
    if (hide_widget_outer_lines === true) {
      elements.newsWidgetWrap.classList.add("hide-widget-outer-lines");
    } else {
      elements.newsWidgetWrap.classList.remove("hide-widget-outer-lines");
    }
  }

  // Safely update classList for noNewsTextWrap if it exists
  if (elements.noNewsTextWrap) {
    elements.noNewsTextWrap.classList.remove(
      "no-active-news",
      "no-archived-news"
    );
    if (newsItems.length === 0) {
      elements.noNewsTextWrap.classList.add(
        tabname === "active" ? "no-active-news" : "no-archived-news"
      );
    }
  }

  // Set display property for all elements based on whether we have news
  const displayValues = {
    newsGridWrap: newsItems.length === 0 ? "none" : "grid",
    // Hide view all button if hide_all_news_bottom_button is true or no news items
    viewAllNewsBtn:
      hide_all_news_bottom_button || newsItems.length === 0 ? "none" : "block",
    // Show search only if show_search_bar is true
    searchWrap:
      show_search_bar === false
        ? "none"
        : newsItems.length === 0
        ? "none"
        : "flex",
    // Hide both category controls if hide_categories is true
    // Otherwise show appropriate control based on device
    categoriesButtonsWrap: hide_categories
      ? "none"
      : device === "mobile"
      ? "none"
      : "block",
    categoriesDropdownWrap: hide_categories
      ? "none"
      : device === "mobile"
      ? "block"
      : "none",
  };

  // Safely update display properties
  Object.entries(displayValues).forEach(([key, value]) => {
    if (elements[key]) {
      elements[key].style.display = value;
    }
  });
}

// ---------------INITIALIZE FUNCTIONS--------------- //

fetchNews();
