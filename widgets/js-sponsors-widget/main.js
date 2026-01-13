import { sponsors, data } from "./dummyData.js";

// ---------- GLOBAL VARIABLES ---------- //

let groupedSponsors = {};
let device = data.device;

// ** DUDA EDITOR CONFIG VARIABLES **

const dark_mode = data.config.dark_mode;
const show_sponsors = data.config.show_sponsors;
const default_view_on_mobile = data.config.default_view_on_mobile || "tiles";
const default_view_on_desktop = data.config.default_view_on_desktop || "tiles";
const default_card_line_color = data.config.default_card_line_color;
const hide_view_buttons = data.config.hide_view_buttons;
const hide_search_bar = data.config.hide_search_bar;
const hide_filter_button = data.config.hide_filter_button;

const hide_sponsor_logo = data.config.hide_sponsor_logo;
const hide_sponsor_name = data.config.hide_sponsor_name;
const hide_sponsor_since = data.config.hide_sponsor_since;
const hide_sponsor_category = data.config.hide_sponsor_category;
const hide_sponsor_description = data.config.hide_sponsor_description || true;

// ---------- SELECTORS ---------- //

const search_input = document.querySelector(
  ".lx-sponsors-wrap .main-header-wrap .search-input"
);

// ---------- EVENT LISTENERS ---------- //

if (search_input) {
  search_input.addEventListener("input", () => {
    const search_value = search_input.value.trim().toLowerCase();
    const noResultsTemplate = document.querySelector(".no-results-template");

    // Check if groupedSponsors is initialized
    if (!groupedSponsors || Object.keys(groupedSponsors).length === 0) {
      return;
    }

    // Get all sponsors from the grouped sponsors
    const allSponsors = Object.values(groupedSponsors).flat();

    if (search_value === "") {
      // If search is empty, show all sponsors in both views and hide no-results template
      if (noResultsTemplate) {
        noResultsTemplate.style.display = "none";
      }
      appendSponsorsToTilesView(groupedSponsors);
      appendSponsorsToListView(groupedSponsors);
      handleDudaWidgetCardAndListElements(); // Handle element visibility
      handleWidgetMediumContainer(); // Handle widget medium container
      return;
    }

    // Filter sponsors based on search value
    const searchedSponsors = allSponsors.filter((sponsor) => {
      const nameMatch = sponsor.name?.toLowerCase().includes(search_value);
      const descMatch = sponsor.description
        ?.toLowerCase()
        .includes(search_value);
      const categoryString = getCategoryString(sponsor.categories);
      const categoryMatch = categoryString
        ?.toLowerCase()
        .includes(search_value);
      return nameMatch || descMatch || categoryMatch;
    });

    if (searchedSponsors.length === 0) {
      // Show no results template and clear both views
      if (noResultsTemplate) {
        noResultsTemplate.style.display = "flex";
      }
      const tilesWrap = document.querySelector(".main-sponsors-wrap-tiles");
      const listWrap = document.querySelector(".main-sponsors-wrap-list");
      if (tilesWrap) tilesWrap.innerHTML = "";
      if (listWrap) listWrap.innerHTML = "";
      return;
    }

    // Hide no-results template if there are results
    if (noResultsTemplate) {
      noResultsTemplate.style.display = "none";
    }

    // Group searched sponsors by category
    const searchedGroupedSponsors = searchedSponsors.reduce((acc, sponsor) => {
      const category = getCategoryString(sponsor.categories);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(sponsor);
      return acc;
    }, {});

    // Show found sponsors in both views
    appendSponsorsToTilesView(searchedGroupedSponsors);
    appendSponsorsToListView(searchedGroupedSponsors);
    handleWidgetMediumContainer(); // Handle widget medium container
    handleDudaWidgetCardAndListElements(); // Handle element visibility
  });
}

// ---------- FUNCTIONS ---------- //

// ** VIEW TOGGLE **

function initViewToggle() {
  const viewButtonsWrap = document.querySelector(
    ".lx-sponsors-wrap .main-header-wrap .view-buttons-wrap"
  );
  if (!viewButtonsWrap) return;

  const listBtn = viewButtonsWrap.querySelector(".view-list-btn");
  const tilesBtn = viewButtonsWrap.querySelector(".view-tiles-btn");
  const listContainer = document.querySelector(".list-container");
  const tilesContainer = document.querySelector(".tiles-container");

  if (!listBtn || !tilesBtn || !listContainer || !tilesContainer) return;

  function toggleView(activeBtn, inactiveBtn) {
    activeBtn.classList.add("active");
    inactiveBtn.classList.remove("active");
  }

  listBtn.addEventListener("click", function () {
    toggleView(listBtn, tilesBtn);
    listContainer.style.display = "block";
    tilesContainer.style.display = "none";
  });

  tilesBtn.addEventListener("click", function () {
    toggleView(tilesBtn, listBtn);
    tilesContainer.style.display = "block";
    listContainer.style.display = "none";
  });
}

// ** FILTER DROPDOWN **

function initFilterDropdown() {
  const filterDropdownBtn = document.querySelector(".filter-dropdown-btn");
  const filterDropdownPanel = document.querySelector(".filter-dropdown-panel");

  if (!filterDropdownBtn || !filterDropdownPanel) return;

  function toggleDropdown(e) {
    e.stopPropagation();
    const isHidden =
      window.getComputedStyle(filterDropdownPanel).display === "none";
    filterDropdownPanel.style.display = isHidden ? "block" : "none";
  }

  function closeDropdownOnOutsideClick(e) {
    if (
      !filterDropdownBtn.contains(e.target) &&
      !filterDropdownPanel.contains(e.target)
    ) {
      filterDropdownPanel.style.display = "none";
    }
  }

  filterDropdownBtn.addEventListener("click", toggleDropdown);
  document.addEventListener("click", closeDropdownOnOutsideClick);
}

// ** GET SPONSORS **

function getSponsors() {
  // For Duda CM API
  //const sponsors = data.config.lstSponsors;

  if (sponsors.length === 0) {
    document.querySelector(".sponsors-alert-message").style.display = "block";
    document.querySelector(".main-sponsors-wrap-tiles").style.display = "none";
    return;
  }

  groupedSponsors = groupSponsorsByCategory(sponsors);
  appendSponsorsToTilesView(groupedSponsors);
  appendSponsorsToListView(groupedSponsors);
  renderCategoriesInDropdown(); // Initialize category dropdown
  handleDudaWidgetCardAndListElements(); // Handle element visibility
  handleWidgetMediumContainer(); // Handle widget medium container
}

// ** HELPER FUNCTION TO GET CATEGORY STRING FROM ARRAY **
function getCategoryString(categories) {
  // If categories is not an array or is empty, return "Others"
  if (!Array.isArray(categories) || categories.length === 0) {
    return "Others";
  }
  // Return the first category from the array
  return categories[0];
}

// ** GROUP SPONSORS BY CATEGORY**

function groupSponsorsByCategory(sponsors) {
  groupedSponsors = sponsors.reduce((acc, sponsor) => {
    const category = getCategoryString(sponsor.categories);

    // Handle empty category case - assign to "Others"
    if (category === "Others") {
      if (!acc.Others) {
        acc.Others = [];
      }
      acc.Others.push(sponsor);
      return acc;
    }

    // Handle normal category case
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(sponsor);

    return acc;
  }, {});
  return groupedSponsors;
}

// ** APPEND SPONSORS TO TILES VIEW**

function appendSponsorsToTilesView(groupedSponsors) {
  const mainSponsorsWrap = document.querySelector(".main-sponsors-wrap-tiles");
  const filterSponsorsWrap = document.querySelector(".filter-sponsors-wrap");
  mainSponsorsWrap.innerHTML = "";

  if (show_sponsors === "without_categories") {
    // Hide filter categories buttons if enabled and without_categories mode is enabled

    // Create a single wrap for all sponsors
    const singleSponsorsWrap = document.createElement("div");
    singleSponsorsWrap.classList.add("single-sponsors-wrap");
    singleSponsorsWrap.setAttribute("data-category", "all");

    // Create sponsors grid
    const sponsorsGrid = document.createElement("div");
    sponsorsGrid.classList.add(
      "sponsor-cards-grid",
      "sponsors-grid",
      "sponsors-grid-cols-1",
      "sponsors-sm-grid-cols-2",
      "sponsors-lg-grid-cols-3",
      "sponsors-xl-grid-cols-4"
    );

    // Get all sponsors and sort them alphabetically by name
    const allSponsors = Object.values(groupedSponsors)
      .flat()
      .sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

    // Add sorted sponsors to the grid
    allSponsors.forEach((sponsor) => {
      const categoryString = getCategoryString(sponsor.categories);
      const sponsorCard = createSponsorCardForTilesView(
        sponsor,
        categoryString === "Others" ? "Others" : categoryString
      );
      sponsorsGrid.appendChild(sponsorCard);
    });

    singleSponsorsWrap.appendChild(sponsorsGrid);
    mainSponsorsWrap.appendChild(singleSponsorsWrap);
  } else {
    // Sort categories to put Others last
    const sortedCategories = Object.entries(groupedSponsors).sort(
      ([catA], [catB]) => {
        if (catA === "Others") return 1;
        if (catB === "Others") return -1;
        return catA.localeCompare(catB);
      }
    );

    // Iterate over each category and its sponsors
    sortedCategories.forEach(([category, sponsors]) => {
      // Create single sponsors wrap
      const singleSponsorsWrap = document.createElement("div");
      singleSponsorsWrap.classList.add("single-sponsors-wrap");
      singleSponsorsWrap.setAttribute("data-category", category);

      // Create category header
      const categoryHeaderWrap = document.createElement("div");
      categoryHeaderWrap.classList.add("category-header-wrap");

      const categoryName = document.createElement("h2");
      categoryName.classList.add("category-name", "main-category-title");

      // Add category name text
      if (category === "Others") {
        categoryName.appendChild(document.createTextNode("Others"));
      } else {
        categoryName.appendChild(document.createTextNode(category));
      }

      // Add sponsor count span
      const sponsorsCount = document.createElement("span");
      sponsorsCount.classList.add("sponsors-count");
      sponsorsCount.textContent = sponsors.length;
      categoryName.appendChild(sponsorsCount);

      // Create chevron SVG icon
      const chevronSvg = createChevronDownSvg(true); // Start expanded (pointing up)

      categoryHeaderWrap.appendChild(categoryName);
      categoryHeaderWrap.appendChild(chevronSvg);
      singleSponsorsWrap.appendChild(categoryHeaderWrap);

      // Create sponsors grid
      const sponsorsGrid = document.createElement("div");
      sponsorsGrid.classList.add(
        "sponsor-cards-grid",
        "sponsors-grid",
        "sponsors-grid-cols-1",
        "sponsors-sm-grid-cols-2",
        "sponsors-lg-grid-cols-3",
        "sponsors-xl-grid-cols-4"
      );

      // Sort sponsors alphabetically by name within category
      const sortedSponsors = [...sponsors].sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

      // Add sponsor cards
      sortedSponsors.forEach((sponsor) => {
        const sponsorCard = createSponsorCardForTilesView(sponsor, category);
        sponsorsGrid.appendChild(sponsorCard);
      });

      singleSponsorsWrap.appendChild(sponsorsGrid);
      mainSponsorsWrap.appendChild(singleSponsorsWrap);

      // Add click handler for accordion functionality
      categoryHeaderWrap.style.cursor = "pointer";
      categoryHeaderWrap.addEventListener("click", () => {
        const currentDisplay = sponsorsGrid.style.display;
        const isCurrentlyExpanded =
          currentDisplay === "" ||
          currentDisplay === "block" ||
          currentDisplay === "grid";
        if (isCurrentlyExpanded) {
          // Collapse
          sponsorsGrid.style.display = "none";
          chevronSvg.style.transform = "rotate(0deg)"; // Point down when collapsed
        } else {
          // Expand
          sponsorsGrid.style.display = "grid";
          chevronSvg.style.transform = "rotate(180deg)"; // Point up when expanded
        }
      });
    });
  }
}

function createSponsorCardForTilesView(sponsor, category) {
  // Create main card element
  const card = document.createElement("div");
  card.classList.add("single-sponsor-card", "shadow");

  // Create top line
  const topLine = document.createElement("div");
  topLine.classList.add("top-line", "top-line-color");
  topLine.style.backgroundColor = default_card_line_color;
  card.appendChild(topLine);

  // Create content wrap
  const contentWrap = document.createElement("div");
  contentWrap.classList.add("content-wrap");

  // Create top wrap
  const topWrap = document.createElement("div");
  topWrap.classList.add("top-wrap");

  // Create bottom wrap
  const bottomWrap = document.createElement("div");
  bottomWrap.classList.add("bottom-wrap");

  // Create logo wrap
  const logoWrap = document.createElement("div");
  logoWrap.classList.add("logo-wrap");

  const logoImg = document.createElement("img");
  logoImg.alt = `${sponsor.name || ""} logo`;

  // Add error handling for image loading
  logoImg.onerror = () => {
    logoImg.style.display = "none"; // Hide broken image
    logoWrap.classList.add("no-image"); // Add class for styling
  };

  // Clean and validate image URL
  let imageUrl = sponsor.image_url || "";

  // If URL contains 'lisa-is.nl', try to fix it
  if (imageUrl.includes("lisa-is.nl")) {
    // Remove www and any double slashes (except after http/https)
    imageUrl = imageUrl.replace("www.", "").replace(/([^:])\/\//g, "$1/");

    // Ensure https protocol
    if (!imageUrl.startsWith("https://")) {
      imageUrl = `https://${imageUrl.replace("http://", "")}`;
    }
  }

  // Set src after adding error handler and cleaning URL
  logoImg.src = imageUrl;
  logoWrap.appendChild(logoImg);
  topWrap.appendChild(logoWrap);

  const sponsorName = document.createElement("h3");
  sponsorName.classList.add("sponsor-name", "card-sponsor-name");
  sponsorName.textContent = sponsor.name ? sponsor.name : "";
  contentWrap.appendChild(sponsorName);

  // Create category label
  const categoryLabel = document.createElement("div");
  categoryLabel.classList.add(
    "category-label",
    "category-label-text",
    "category-label-bg"
  );
  // Only show category label if there's a category or if it's "Others"
  if (category === "Others" || (category && category !== "")) {
    if (category === "Others") {
      categoryLabel.textContent = "Others";
    } else {
      categoryLabel.textContent = category;
    }
  }

  // just get the year from the sponsor_since date
  const sponsorSinceYear = sponsor.sponsor_since
    ? new Date(sponsor.sponsor_since).getFullYear()
    : "";
  let sponsorSinceWrap = null;
  // Only create sponsor since wrap if hide_sponsor_since is false and sponsorSinceYear exists
  const shouldHideSince =
    hide_sponsor_since === true ||
    hide_sponsor_since === "true" ||
    hide_sponsor_since === 1;
  if (sponsorSinceYear && !shouldHideSince) {
    sponsorSinceWrap = document.createElement("div");
    sponsorSinceWrap.classList.add("sponsor-since-wrap");

    // Add calendar SVG icon directly to wrap
    const calendarSvg = createCalendarSvg();
    sponsorSinceWrap.appendChild(calendarSvg);

    const sponsorSince = document.createElement("span");
    sponsorSince.classList.add("sponsor-since-text");
    // Add text node for the year
    const textNode = document.createTextNode(`Since ${sponsorSinceYear}`);
    sponsorSince.appendChild(textNode);

    sponsorSinceWrap.appendChild(sponsorSince);
  }

  // Create description
  const description = document.createElement("div");
  description.classList.add("sponsor-desc");
  if (hide_sponsor_description === false) {
    description.classList.add("show-description");
  }
  description.innerHTML = sponsor.description || "";

  // Append all content elements

  contentWrap.appendChild(topWrap);
  contentWrap.appendChild(bottomWrap);
  bottomWrap.appendChild(categoryLabel);
  bottomWrap.appendChild(sponsorName);
  if (sponsorSinceWrap) {
    bottomWrap.appendChild(sponsorSinceWrap);
  }
  bottomWrap.appendChild(description);
  card.appendChild(contentWrap);

  // Create button wrap
  const btnWrap = document.createElement("div");
  btnWrap.classList.add("btn-wrap");

  const visitBtn = document.createElement("a");
  visitBtn.classList.add(
    "btn-primary",
    "visit-site-btn",
    "card-button-text",
    "card-button-bg"
  );
  visitBtn.textContent = "Visit website";
  visitBtn.href = sponsor.url || "";
  visitBtn.target = "_blank";
  // add visibility hidden if sponsor.url is not present
  if (!sponsor.url) {
    visitBtn.style.visibility = "hidden";
  }

  // Create SVG icon
  const svg = createExternalLinkSvg();
  visitBtn.appendChild(svg);
  btnWrap.appendChild(visitBtn);
  card.appendChild(btnWrap);

  return card;
}

// ** APPEND SPONSORS TO LIST VIEW**

function appendSponsorsToListView(groupedSponsors) {
  const mainSponsorsWrapList = document.querySelector(
    ".main-sponsors-wrap-list"
  );
  const filterSponsorsWrap = document.querySelector(".filter-sponsors-wrap");
  mainSponsorsWrapList.innerHTML = "";

  if (show_sponsors === "without_categories") {
    // Create a single wrap for all sponsors
    const singleListWrap = document.createElement("div");
    singleListWrap.classList.add("single-list-wrap");
    singleListWrap.setAttribute("data-category", "all");

    // Create sponsor list
    const sponsorList = document.createElement("div");
    sponsorList.classList.add("sponsor-list");

    // Get all sponsors and sort them alphabetically by name
    const allSponsors = Object.values(groupedSponsors)
      .flat()
      .sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

    // Add sorted sponsors to the list
    allSponsors.forEach((sponsor) => {
      const categoryString = getCategoryString(sponsor.categories);
      const sponsorItem = createSponsorItemForListView(
        sponsor,
        categoryString === "Others" ? "Others" : categoryString
      );
      sponsorList.appendChild(sponsorItem);
    });

    singleListWrap.appendChild(sponsorList);
    mainSponsorsWrapList.appendChild(singleListWrap);
  } else {
    // Sort categories to put Others last
    const sortedCategories = Object.entries(groupedSponsors).sort(
      ([catA], [catB]) => {
        if (catA === "Others") return 1;
        if (catB === "Others") return -1;
        return catA.localeCompare(catB);
      }
    );

    // Iterate over each category and its sponsors
    sortedCategories.forEach(([category, sponsors]) => {
      // Create single list wrap
      const singleListWrap = document.createElement("div");
      singleListWrap.classList.add("single-list-wrap");
      singleListWrap.setAttribute("data-category", category);

      // Create category header
      const categoryHeaderWrap = document.createElement("div");
      categoryHeaderWrap.classList.add("list-category-header-wrap");

      const categoryName = document.createElement("h2");
      categoryName.classList.add("list-category-name");

      // Add category name text
      if (category === "Others") {
        categoryName.appendChild(document.createTextNode("Others"));
      } else {
        categoryName.appendChild(document.createTextNode(category));
      }

      // Add sponsor count span
      const sponsorsCount = document.createElement("span");
      sponsorsCount.classList.add("list-sponsors-count");
      sponsorsCount.textContent = sponsors.length;
      categoryName.appendChild(sponsorsCount);

      // Create chevron SVG icon
      const chevronSvg = createChevronDownSvg(true); // Start expanded (pointing up)

      categoryHeaderWrap.appendChild(categoryName);
      categoryHeaderWrap.appendChild(chevronSvg);
      singleListWrap.appendChild(categoryHeaderWrap);

      // Create sponsor list
      const sponsorList = document.createElement("div");
      sponsorList.classList.add("sponsor-list");

      // Sort sponsors alphabetically by name within category
      const sortedSponsors = [...sponsors].sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

      // Add sponsor items
      sortedSponsors.forEach((sponsor) => {
        const sponsorItem = createSponsorItemForListView(sponsor, category);
        sponsorList.appendChild(sponsorItem);
      });

      singleListWrap.appendChild(sponsorList);
      mainSponsorsWrapList.appendChild(singleListWrap);

      // Add click handler for accordion functionality
      categoryHeaderWrap.style.cursor = "pointer";
      categoryHeaderWrap.addEventListener("click", () => {
        const currentDisplay = sponsorList.style.display;
        const isCurrentlyExpanded =
          currentDisplay === "" || currentDisplay === "block";
        if (isCurrentlyExpanded) {
          // Collapse
          sponsorList.style.display = "none";
          chevronSvg.style.transform = "rotate(0deg)"; // Point down when collapsed
        } else {
          // Expand
          sponsorList.style.display = "block";
          chevronSvg.style.transform = "rotate(180deg)"; // Point up when expanded
        }
      });
    });
  }
}

function createSponsorItemForListView(sponsor, category) {
  // Create main item element
  const item = document.createElement("div");
  item.classList.add("single-sponsor-item");

  // Create image outer wrap
  const imgOuterWrap = document.createElement("div");
  imgOuterWrap.classList.add(
    "img-outer-wrap",
    "flex-shrink-0",
    "w-28",
    "md:w-40"
  );

  const imgWrap = document.createElement("div");
  imgWrap.classList.add("img-wrap", "h-20", "md:h-20");

  const logoImg = document.createElement("img");
  logoImg.alt = `${sponsor.name || ""} logo`;

  // Add error handling for image loading
  logoImg.onerror = () => {
    logoImg.style.display = "none";
    imgWrap.classList.add("no-image");
  };

  // Clean and validate image URL
  let imageUrl = sponsor.image_url || "";

  // If URL contains 'lisa-is.nl', try to fix it
  if (imageUrl.includes("lisa-is.nl")) {
    imageUrl = imageUrl.replace("www.", "").replace(/([^:])\/\//g, "$1/");
    if (!imageUrl.startsWith("https://")) {
      imageUrl = `https://${imageUrl.replace("http://", "")}`;
    }
  }

  logoImg.src = imageUrl;
  imgWrap.appendChild(logoImg);
  imgOuterWrap.appendChild(imgWrap);
  item.appendChild(imgOuterWrap);

  // Create details wrap
  const detailsWrap = document.createElement("div");
  detailsWrap.classList.add("details-wrap", "flex-1", "min-w-0");

  // Create sponsor name
  const sponsorNameWrap = document.createElement("div");
  sponsorNameWrap.classList.add("sponsor-name-wrap");
  const sponsorName = document.createElement("h3");
  sponsorName.classList.add("sponsor-name");
  sponsorName.textContent = sponsor.name ? sponsor.name : "";
  sponsorNameWrap.appendChild(sponsorName);
  detailsWrap.appendChild(sponsorNameWrap);

  // Create category label
  const categoryLabelWrap = document.createElement("div");
  categoryLabelWrap.classList.add("category-label-wrap");
  const categoryLabel = document.createElement("div");
  categoryLabel.classList.add("category-label");
  if (category === "Others" || (category && category !== "")) {
    if (category === "Others") {
      categoryLabel.textContent = "Others";
    } else {
      categoryLabel.textContent = category;
    }
  }
  categoryLabelWrap.appendChild(categoryLabel);

  // add sponsor since year and dot within categoryLabelWrap
  const sponsorSinceYear = sponsor.sponsor_since
    ? new Date(sponsor.sponsor_since).getFullYear()
    : "";
  // Only create dot and sponsor since if hide_sponsor_since is false and sponsorSinceYear exists
  const shouldHideSince =
    hide_sponsor_since === true ||
    hide_sponsor_since === "true" ||
    hide_sponsor_since === 1;
  if (sponsorSinceYear && !shouldHideSince) {
    const dot = document.createElement("span");
    dot.classList.add("dot");
    dot.textContent = "•";
    categoryLabelWrap.appendChild(dot);
    const sponsorSince = document.createElement("span");
    sponsorSince.classList.add("sponsor-since-text");
    sponsorSince.textContent = `Since ${sponsorSinceYear}`;
    categoryLabelWrap.appendChild(sponsorSince);
  }

  detailsWrap.appendChild(categoryLabelWrap);

  // Create description
  const description = document.createElement("div");
  description.classList.add("sponsor-desc", "visibility-hidden", "md-block");
  if (hide_sponsor_description === false) {
    description.classList.add("show-description");
  }
  description.innerHTML = sponsor.description || "";
  detailsWrap.appendChild(description);

  item.appendChild(detailsWrap);

  // Create button wrap
  const btnWrap = document.createElement("div");
  btnWrap.classList.add("btn-wrap");

  const visitBtn = document.createElement("a");
  visitBtn.classList.add(
    "btn-primary",
    "visit-site-btn",
    "card-button-text",
    "card-button-bg"
  );
  visitBtn.textContent = "Visit website";
  visitBtn.href = sponsor.url || "";
  visitBtn.target = "_blank";
  if (!sponsor.url) {
    visitBtn.style.visibility = "hidden";
  }

  // Create SVG icon
  const svg = createExternalLinkSvg();
  visitBtn.appendChild(svg);
  btnWrap.appendChild(visitBtn);
  item.appendChild(btnWrap);

  return item;
}

// ** RENDER CATEGORIES IN DROPDOWN **

function renderCategoriesInDropdown() {
  const noResultsTemplate = document.querySelector(".no-results-template");
  const filterDropdownButton = document.querySelector(".filter-dropdown-btn");
  const categoriesDropdownWrap = document.querySelector(
    ".news-categories-wrap"
  );
  const checkboxItemsWrap = categoriesDropdownWrap?.querySelector(
    ".checkbox-items-wrap"
  );
  const clearAllBtn = document.querySelector(".clear-all-btn");

  if (!checkboxItemsWrap) return;

  // Check if groupedSponsors is initialized
  if (!groupedSponsors || Object.keys(groupedSponsors).length === 0) {
    return;
  }

  // Clone the template SVG before clearing (it's inside checkboxItemsWrap)
  const templateCheckbox = checkboxItemsWrap.querySelector(".checkbox-item");
  let templateSvg = null;
  if (templateCheckbox) {
    const templateSvgElement = templateCheckbox.querySelector("svg");
    if (templateSvgElement) {
      templateSvg = templateSvgElement.cloneNode(true);
    }
  }

  // Clear existing items
  checkboxItemsWrap.innerHTML = "";

  // Get all categories from groupedSponsors
  const categoriesWithItems = new Set();
  let hasOverige = false;

  Object.keys(groupedSponsors).forEach((category) => {
    if (groupedSponsors[category].length > 0) {
      if (!category || category === "Others") {
        hasOverige = true;
      } else {
        categoriesWithItems.add(category);
      }
    }
  });

  // Create final categories array, with sorted categories and "Others" last if it exists
  // We'll display "Overige" in the UI but keep "Others" as the category key
  const categories = Array.from(categoriesWithItems).sort();
  if (hasOverige) {
    categories.push("Others");
  }

  // Create checkbox items for each category
  categories.forEach((category) => {
    if (!category) return;

    const checkboxItem = document.createElement("div");
    checkboxItem.className = "checkbox-item";
    checkboxItem.setAttribute("data-state", "unchecked");

    // Create button
    const button = document.createElement("button");
    button.className = "checkbox-item-button";
    button.setAttribute("data-button-name", category.toLowerCase());

    // Create span for SVG
    const span = document.createElement("span");
    if (templateSvg) {
      span.appendChild(templateSvg.cloneNode(true));
    } else {
      // Fallback: create SVG if template not found
      const svg = createCheckboxSvg();
      span.appendChild(svg);
    }

    // Create label - use "Overige" for "Others"
    const label = document.createElement("label");
    label.className = "checkbox-item-label";
    label.setAttribute("for", category.toLowerCase());
    label.textContent = category === "Others" ? "Overige" : category;

    // Add click handlers to both button and label
    button.addEventListener("click", (e) => {
      e.preventDefault();
      handleCategorySelection(
        checkboxItem,
        checkboxItemsWrap,
        filterDropdownButton
      );
    });

    label.addEventListener("click", (e) => {
      e.preventDefault();
      handleCategorySelection(
        checkboxItem,
        checkboxItemsWrap,
        filterDropdownButton
      );
    });

    // Assemble checkbox item
    button.appendChild(span);
    checkboxItem.append(button, label);
    checkboxItemsWrap.appendChild(checkboxItem);
  });

  // Add clearAllBtn event listener once, outside the loop
  if (clearAllBtn) {
    // Remove existing listeners by cloning and replacing
    const newClearAllBtn = clearAllBtn.cloneNode(true);
    if (clearAllBtn.parentNode) {
      clearAllBtn.parentNode.replaceChild(newClearAllBtn, clearAllBtn);
    }

    newClearAllBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Uncheck all checkboxes
      checkboxItemsWrap.querySelectorAll(".checkbox-item").forEach((item) => {
        item.setAttribute("data-state", "unchecked");
      });

      // Hide no results template
      if (noResultsTemplate) {
        noResultsTemplate.style.display = "none";
      }

      // Show all sponsors in both views
      appendSponsorsToTilesView(groupedSponsors);
      appendSponsorsToListView(groupedSponsors);
      handleDudaWidgetCardAndListElements(); // Handle element visibility
      handleWidgetMediumContainer(); // Handle widget medium container
      // Remove active state from filter button
      if (filterDropdownButton) {
        filterDropdownButton.classList.remove("active");
      }

      // Update categories dropdown
      renderCategoriesInDropdown();
    });
  }
}

// ** HANDLE CATEGORY SELECTION **

function handleCategorySelection(
  checkboxItem,
  checkboxItemsWrap,
  filterDropdownButton
) {
  const noResultsTemplate = document.querySelector(".no-results-template");
  const searchValue = search_input?.value.trim().toLowerCase() || "";

  // Check if groupedSponsors is initialized
  if (!groupedSponsors || Object.keys(groupedSponsors).length === 0) {
    return;
  }

  // Toggle checkbox state
  const isChecked = checkboxItem.getAttribute("data-state") === "checked";
  checkboxItem.setAttribute("data-state", isChecked ? "unchecked" : "checked");

  // Get all checked categories - map "Overige" back to "Others" for filtering
  const checkedCategories = Array.from(
    checkboxItemsWrap.querySelectorAll(".checkbox-item[data-state='checked']")
  ).map((item) => {
    const labelText = item.querySelector(".checkbox-item-label").textContent;
    return labelText === "Overige" ? "Others" : labelText;
  });

  if (checkedCategories.length > 0) {
    filterDropdownButton.classList.add("active");
  } else {
    filterDropdownButton.classList.remove("active");
  }

  // Get all sponsors from groupedSponsors
  let filteredSponsors = Object.values(groupedSponsors).flat();

  // Filter by categories if any are selected
  if (checkedCategories.length > 0) {
    filteredSponsors = filteredSponsors.filter((sponsor) => {
      const sponsorCategory = getCategoryString(sponsor.categories);
      return checkedCategories.includes(sponsorCategory);
    });
  }

  // Apply search filter if search input is not empty
  if (searchValue !== "") {
    filteredSponsors = filteredSponsors.filter((sponsor) => {
      const nameMatch = sponsor.name?.toLowerCase().includes(searchValue);
      const descMatch = sponsor.description
        ?.toLowerCase()
        .includes(searchValue);
      const categoryString = getCategoryString(sponsor.categories);
      const categoryMatch = categoryString?.toLowerCase().includes(searchValue);
      return nameMatch || descMatch || categoryMatch;
    });
  }

  // Show no results if no items match
  if (filteredSponsors.length === 0) {
    if (noResultsTemplate) {
      noResultsTemplate.style.display = "flex";
    }
    const tilesWrap = document.querySelector(".main-sponsors-wrap-tiles");
    const listWrap = document.querySelector(".main-sponsors-wrap-list");
    if (tilesWrap) tilesWrap.innerHTML = "";
    if (listWrap) listWrap.innerHTML = "";
  } else {
    // Hide no results template
    if (noResultsTemplate) {
      noResultsTemplate.style.display = "none";
    }

    // Group filtered sponsors by category
    const filteredGroupedSponsors = filteredSponsors.reduce((acc, sponsor) => {
      const category = getCategoryString(sponsor.categories);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(sponsor);
      return acc;
    }, {});

    // Show filtered sponsors in both views
    appendSponsorsToTilesView(filteredGroupedSponsors);
    appendSponsorsToListView(filteredGroupedSponsors);
    handleDudaWidgetCardAndListElements(); // Handle element visibility
    handleWidgetMediumContainer(); // Handle widget medium container
  }
}

// ** HANDLE DARK MODE **

function handleDarkMode() {
  const lxSponsorsWrap = document.querySelector(".lx-sponsors-wrap");
  if (!lxSponsorsWrap) return;

  if (dark_mode === true || dark_mode === "true" || dark_mode === 1) {
    lxSponsorsWrap.classList.add("dark-mode");
  } else {
    lxSponsorsWrap.classList.remove("dark-mode");
  }
}

// ** SHOW LOADER**

function handleLoader() {
  if (sponsors.length > 0) {
    //if (data.config.lstSponsors.length > 0) {
    document.querySelector(".lx-sponsors-loader").style.display = "none";
    document.querySelector(".lx-sponsors-wrap").style.display = "block";
  } else {
    document.querySelector(".lx-sponsors-loader").style.display = "flex";
    document.querySelector(".lx-sponsors-wrap").style.display = "none";
  }
}

// ** HANDLE WIDGET MEDIUM CONTAINERS**

function handleWidgetMediumContainer() {
  const lxSponsorsWrap = document.querySelector(".lx-sponsors-wrap");
  const sponsorsContainer = document.querySelector(".main-sponsors-wrap-tiles");
  const sponsorsCardGrids = document.querySelectorAll(".sponsor-cards-grid");
  if (!sponsorsCardGrids.length) return;

  // Get the container width using getBoundingClientRect for accurate measurement
  const containerWidth = lxSponsorsWrap.getBoundingClientRect().width;
  console.log("containerWidth", containerWidth);
  // Update classes for all grids
  sponsorsCardGrids.forEach((grid) => {
    if (containerWidth > 501 && containerWidth < 800) {
      grid.classList.remove("sponsors-lg-grid-cols-3");
      grid.classList.remove("sponsors-xl-grid-cols-4");
    } else {
      grid.classList.add("sponsors-lg-grid-cols-3");
      grid.classList.add("sponsors-xl-grid-cols-4");
    }
  });

  // Update container class
  if (containerWidth > 501 && containerWidth < 800) {
    sponsorsContainer.classList.add("medium-container");
  } else {
    sponsorsContainer.classList.remove("medium-container");
  }
}

// ** HANDLE DUDA WIDGET CARD & LIST ELEMENTS**

function handleDudaWidgetCardAndListElements() {
  const dudaWidgetCard = document.querySelector(".duda-widget-card");
  const dudaWidgetList = document.querySelector(".duda-widget-list");

  if (dudaWidgetCard && dudaWidgetList) {
    dudaWidgetCard.style.display = "none";
    dudaWidgetList.style.display = "block";
  }

  // Handle visibility for card view elements
  const cardLogoWraps = document.querySelectorAll(
    ".single-sponsor-card .top-wrap"
  );
  const cardSponsorNames = document.querySelectorAll(
    ".single-sponsor-card .sponsor-name"
  );
  const cardCategoryLabels = document.querySelectorAll(
    ".single-sponsor-card .category-label"
  );
  const cardDescriptions = document.querySelectorAll(
    ".single-sponsor-card .sponsor-desc"
  );

  // Handle visibility for list view elements
  const listImgOuterWraps = document.querySelectorAll(
    ".single-sponsor-item .img-outer-wrap"
  );
  const listSponsorNames = document.querySelectorAll(
    ".single-sponsor-item .sponsor-name"
  );
  const listCategoryLabels = document.querySelectorAll(
    ".single-sponsor-item .category-label"
  );
  const listDescriptions = document.querySelectorAll(
    ".single-sponsor-item .sponsor-desc"
  );

  // Helper function to check if value is truthy (handles both string and boolean)
  const shouldHide = (value) => {
    if (value === undefined || value === null) return false;
    return value === true || value === "true" || value === 1;
  };

  // Get header wrap elements
  const mainHeaderWrap = document.querySelector(".main-header-wrap");
  const topWrap = mainHeaderWrap?.querySelector(".top-wrap");
  const bottomWrap = mainHeaderWrap?.querySelector(".bottom-wrap");

  // Handle view buttons visibility
  const viewButtonsWrap = document.querySelector(".view-buttons-wrap");
  if (viewButtonsWrap) {
    viewButtonsWrap.style.visibility = shouldHide(hide_view_buttons)
      ? "hidden"
      : "visible";
  }

  // Handle filter button visibility
  const filterBtnWrap = document.querySelector(".filter-btn-wrap");
  if (filterBtnWrap) {
    filterBtnWrap.style.visibility = shouldHide(hide_filter_button)
      ? "hidden"
      : "visible";
  }

  // When both view buttons and filter button are hidden, hide top-wrap
  if (topWrap) {
    const bothTopHidden =
      shouldHide(hide_view_buttons) && shouldHide(hide_filter_button);
    topWrap.style.display = bothTopHidden ? "none" : "flex";
  }

  // Handle search bar visibility - use display on bottom-wrap
  if (bottomWrap) {
    bottomWrap.style.display = shouldHide(hide_search_bar) ? "none" : "block";
    // if hide search bar is true, add padding-bottom 0 to main-header-wrap
    if (shouldHide(hide_search_bar)) {
      mainHeaderWrap.style.paddingBottom = "0px";
    } else {
      mainHeaderWrap.style.paddingBottom = "1rem";
    }
  }

  // When both top-wrap and bottom-wrap are hidden, hide main-header-wrap
  if (mainHeaderWrap && topWrap && bottomWrap) {
    const topHidden =
      shouldHide(hide_view_buttons) && shouldHide(hide_filter_button);
    const bottomHidden = shouldHide(hide_search_bar);
    if (topHidden && bottomHidden) {
      mainHeaderWrap.style.display = "none";
    } else {
      mainHeaderWrap.style.display = "block";
    }
  }

  function setDefaultView() {
    const isMobile = window.innerWidth < 768;
    const defaultView = isMobile
      ? default_view_on_mobile
      : default_view_on_desktop;

    const currentListContainer = document.querySelector(".list-container");
    const currentTilesContainer = document.querySelector(".tiles-container");
    const currentListBtn = document.querySelector(".view-list-btn");
    const currentTilesBtn = document.querySelector(".view-tiles-btn");

    if (
      currentListContainer &&
      currentTilesContainer &&
      currentListBtn &&
      currentTilesBtn
    ) {
      if (defaultView === "list") {
        currentListContainer.style.display = "block";
        currentTilesContainer.style.display = "none";
        currentListBtn.classList.add("active");
        currentTilesBtn.classList.remove("active");
      } else {
        currentListContainer.style.display = "none";
        currentTilesContainer.style.display = "block";
        currentTilesBtn.classList.add("active");
        currentListBtn.classList.remove("active");
      }
    }
  }

  // Set default view on load
  setDefaultView();

  // Update view on resize (only add listener once)
  if (!window._defaultViewResizeHandler) {
    window._defaultViewResizeHandler = setDefaultView;
    window.addEventListener("resize", window._defaultViewResizeHandler);
  }

  // Apply visibility after DOM is updated
  requestAnimationFrame(() => {
    // Apply visibility to card view elements
    cardLogoWraps.forEach((element) => {
      const shouldBeHidden = shouldHide(hide_sponsor_logo);
      element.style.display = shouldBeHidden ? "none" : "block";
    });

    cardSponsorNames.forEach((element) => {
      element.style.display = shouldHide(hide_sponsor_name) ? "none" : "block";
    });

    cardCategoryLabels.forEach((element) => {
      element.style.display = shouldHide(hide_sponsor_category)
        ? "none"
        : "block";
    });

    cardDescriptions.forEach((element) => {
      element.style.display = shouldHide(hide_sponsor_description)
        ? "none"
        : "block";
    });

    // Apply visibility to list view elements
    listImgOuterWraps.forEach((element) => {
      element.style.display = shouldHide(hide_sponsor_logo) ? "none" : "block";
    });

    listSponsorNames.forEach((element) => {
      element.style.visibility = shouldHide(hide_sponsor_name)
        ? "hidden"
        : "visible";
    });

    listCategoryLabels.forEach((element) => {
      element.style.visibility = shouldHide(hide_sponsor_category)
        ? "hidden"
        : "visible";
    });

    listDescriptions.forEach((element) => {
      element.style.visibility = shouldHide(hide_sponsor_description)
        ? "hidden"
        : "visible";
    });
  });
}

// ** SVGs FUNCTIONS**

/**
 * Creates a chevron down SVG icon for accordion functionality
 * @param {boolean} isExpanded - Whether the accordion is expanded (default: true)
 * @returns {SVGElement} The chevron SVG element
 */
function createChevronDownSvg(isExpanded = true) {
  const chevronSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  chevronSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  chevronSvg.setAttribute("width", "24");
  chevronSvg.setAttribute("height", "24");
  chevronSvg.setAttribute("viewBox", "0 0 24 24");
  chevronSvg.setAttribute("fill", "none");
  chevronSvg.setAttribute("stroke", "currentColor");
  chevronSvg.setAttribute("stroke-width", "2");
  chevronSvg.setAttribute("stroke-linecap", "round");
  chevronSvg.setAttribute("stroke-linejoin", "round");
  chevronSvg.classList.add(
    "lucide",
    "lucide-chevron-down",
    "h-5",
    "w-5",
    "text-foreground",
    "transition-transform"
  );
  chevronSvg.style.transform = isExpanded ? "rotate(180deg)" : "rotate(0deg)";
  chevronSvg.setAttribute("aria-hidden", "true");

  const chevronPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  chevronPath.setAttribute("d", "m6 9 6 6 6-6");
  chevronSvg.appendChild(chevronPath);

  return chevronSvg;
}

/**
 * Creates an external link SVG icon for visit website buttons
 * @returns {SVGElement} The external link SVG element
 */
function createExternalLinkSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.classList.add("lucide", "lucide-external-link", "ml-2", "h-4", "w-4");
  svg.setAttribute("aria-hidden", "true");

  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("d", "M15 3h6v6");
  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute("d", "M10 14 21 3");
  const path3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path3.setAttribute(
    "d",
    "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
  );

  svg.appendChild(path1);
  svg.appendChild(path2);
  svg.appendChild(path3);

  return svg;
}

/**
 * Creates a checkbox SVG icon for filter dropdown
 * @returns {SVGElement} The checkbox SVG element
 */
function createCheckboxSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "15");
  svg.setAttribute("height", "15");
  svg.setAttribute("viewBox", "0 0 15 15");
  svg.setAttribute("fill", "none");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.classList.add("h-4", "w-4");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
  );
  path.setAttribute("fill", "currentColor");
  path.setAttribute("fill-rule", "evenodd");
  path.setAttribute("clip-rule", "evenodd");
  svg.appendChild(path);

  return svg;
}

/**
 * Creates a calendar SVG icon for sponsor since date
 * @returns {SVGElement} The calendar SVG element
 */
function createCalendarSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.classList.add(
    "lucide",
    "lucide-calendar",
    "mr-1",
    "h-3",
    "lg:h-4",
    "w-3",
    "lg:w-4"
  );
  svg.setAttribute("aria-hidden", "true");

  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("d", "M8 2v4");
  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute("d", "M16 2v4");
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width", "18");
  rect.setAttribute("height", "18");
  rect.setAttribute("x", "3");
  rect.setAttribute("y", "4");
  rect.setAttribute("rx", "2");
  const path3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path3.setAttribute("d", "M3 10h18");

  svg.appendChild(path1);
  svg.appendChild(path2);
  svg.appendChild(rect);
  svg.appendChild(path3);

  return svg;
}

// ---------- INITIALIZE FUNCTIONS ---------- //

handleDarkMode();
handleLoader();
getSponsors();
initViewToggle();
initFilterDropdown();
