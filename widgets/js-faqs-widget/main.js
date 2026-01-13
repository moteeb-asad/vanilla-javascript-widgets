import { data } from "./dummyData.js";

// GLOBAL VARIABLES

let groupedFaqs = {};
let allFaqs = []; // Store all FAQs for filtering
let filterState = {
  selectedCategories: [],
  showOnlyWithAttachments: false,
  searchQuery: "",
};

// DUDA CONTENT EDITOR VARIABLES

const config = data?.config || {};
const device = data.device;
const dark_mode = config.dark_mode;
const hide_search_bar = config.hide_search_bar;
const hide_created_at = config.hide_created_at;
const hide_updated_at = config.hide_updated_at;
const hide_author = config.hide_author;
const collapse_categories = config.collapse_categories;
const default_desktop_view = config.default_desktop_view || "list";
const default_mobile_view = config.default_mobile_view || "list";

// ---------- FUNCTIONS ---------- //

// ** VIEW TOGGLE **

function initViewToggle() {
  const viewButtonsWrap = document.querySelector(".view-btns-wrap");
  if (!viewButtonsWrap) return;

  const listBtn = viewButtonsWrap.querySelector('[data-btn-name="list"]');
  const cardsBtn = viewButtonsWrap.querySelector('[data-btn-name="cards"]');
  const listPanel = document.querySelector('[data-panel-name="list"]');
  const cardsPanel = document.querySelector('[data-panel-name="cards"]');

  if (!listBtn || !cardsBtn || !listPanel || !cardsPanel) return;

  // Set initial state based on device type
  const defaultView =
    device === "mobile" ? default_mobile_view : default_desktop_view;

  if (defaultView === "cards") {
    cardsPanel.classList.add("active");
    listPanel.classList.remove("active");
    cardsBtn.classList.add("active");
    cardsBtn.setAttribute("data-state", "active");
    listBtn.classList.remove("active");
    listBtn.setAttribute("data-state", "inactive");
  } else {
    listPanel.classList.add("active");
    cardsPanel.classList.remove("active");
    listBtn.classList.add("active");
    listBtn.setAttribute("data-state", "active");
    cardsBtn.classList.remove("active");
    cardsBtn.setAttribute("data-state", "inactive");
  }

  function toggleView(activeBtn, inactiveBtn, activePanel, inactivePanel) {
    activeBtn.classList.add("active");
    activeBtn.setAttribute("data-state", "active");
    inactiveBtn.classList.remove("active");
    inactiveBtn.setAttribute("data-state", "inactive");
    activePanel.classList.add("active");
    inactivePanel.classList.remove("active");
  }

  listBtn.addEventListener("click", function () {
    toggleView(listBtn, cardsBtn, listPanel, cardsPanel);
  });

  cardsBtn.addEventListener("click", function () {
    toggleView(cardsBtn, listBtn, cardsPanel, listPanel);
  });
}

// ** INITFILTER DROPDOWN **

function initFilterDropdown() {
  const filterDropdownBtn = document.querySelector(".filter-dropdown-btn");
  const filterDropdownPanel = document.querySelector(".filter-dropdown");

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

  renderCategoriesInDropdown();
  initFilterHandlers();
}

// ** GET FAQS **

function getFaqs() {
  if (!data || !data?.config?.faqs_list) {
    console.warn("FAQ data is not available");
    return;
  }

  const faqs = data?.config?.faqs_list;

  if (!Array.isArray(faqs) || faqs.length === 0) {
    return;
  }

  // Store all FAQs for filtering
  allFaqs = faqs;

  applyFilters();
  initFilterDropdown();
  initSearch();
}

// ** SEARCH FAQS **

function initSearch() {
  const searchInput = document.querySelector(".search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", function () {
    filterState.searchQuery = searchInput.value.toLowerCase().trim();
    applyFilters();
  });
}

// ** CREATE FAQ ITEM IN LIST VIEW **

function createFaqItemInListView(groupedFaqs) {
  const listPanel = document.querySelector('[data-panel-name="list"]');
  const mainAccordionsWrap = listPanel?.querySelector(".main-accordions-wrap");

  if (!mainAccordionsWrap) return;

  // Clear existing content
  mainAccordionsWrap.innerHTML = "";

  // Iterate through each category
  Object.values(groupedFaqs).forEach((category) => {
    const accordionItem = document.createElement("div");
    accordionItem.className = "accordion-item";

    const accordionButton = document.createElement("button");
    accordionButton.className = "accordion-button";

    const accordionTitle = document.createElement("h2");
    accordionTitle.className = "accordion-title";
    accordionTitle.textContent = category.title;

    const countSpan = document.createElement("span");
    countSpan.textContent = category.faqs.length;
    accordionTitle.appendChild(countSpan);

    const chevronSvg = createChevronDownSvg();
    accordionButton.appendChild(accordionTitle);
    accordionButton.appendChild(chevronSvg);

    const accordionContentPanel = document.createElement("div");
    accordionContentPanel.className = "accordion-content-panel";
    accordionContentPanel.style.display = "none";

    const innerWrap = document.createElement("div");
    innerWrap.className = "inner-wrap";

    // Render each FAQ in the category
    category.faqs.forEach((faq) => {
      const singleQuestion = document.createElement("div");
      singleQuestion.className = "single-question";

      const faqQuestionBtn = createFaqQuestionButton(faq);
      const accordionContent = createFaqContent(faq);

      singleQuestion.appendChild(faqQuestionBtn);
      singleQuestion.appendChild(accordionContent);
      innerWrap.appendChild(singleQuestion);
    });

    accordionContentPanel.appendChild(innerWrap);
    accordionItem.appendChild(accordionButton);
    accordionItem.appendChild(accordionContentPanel);
    mainAccordionsWrap.appendChild(accordionItem);

    // Add click handler for accordion toggle
    accordionButton.addEventListener("click", function () {
      const isHidden = accordionContentPanel.style.display === "none";
      accordionContentPanel.style.display = isHidden ? "block" : "none";
      const svg = accordionButton.querySelector("svg");
      if (svg) {
        svg.style.transform = isHidden ? "rotate(0deg)" : "rotate(-90deg)";
      }
    });
  });
}
function createFaqQuestionButton(faq) {
  const button = document.createElement("button");
  button.className = "faq-question-btn";

  const questionInnerWrap = document.createElement("div");
  questionInnerWrap.className = "question-inner-wrap";

  const categoryName = document.createElement("div");
  categoryName.className =
    "category-name category-text-color category-bg-color";
  categoryName.textContent = faq.category_title;

  const faqQuestionTitle = document.createElement("h3");
  faqQuestionTitle.className = "faq-question-title";
  faqQuestionTitle.textContent = faq.title;

  const hasDownloads = faq.assets && faq.assets.length > 0;
  if (hasDownloads) {
    const downloadIcon = createDownloadIconSvg();
    faqQuestionTitle.appendChild(downloadIcon);
  }

  questionInnerWrap.appendChild(categoryName);
  questionInnerWrap.appendChild(faqQuestionTitle);

  button.appendChild(questionInnerWrap);

  // Create chevron SVG element
  const chevronSvgElement = createChevronDownSmallSvg();
  button.appendChild(chevronSvgElement);

  // Add click handler to toggle content
  let contentVisible = false;
  button.addEventListener("click", function () {
    const content = button.nextElementSibling;
    if (content && content.classList.contains("accordion-content")) {
      contentVisible = !contentVisible;
      content.style.display = contentVisible ? "block" : "none";
      if (chevronSvgElement) {
        chevronSvgElement.style.transform = contentVisible
          ? "rotate(180deg)"
          : "rotate(0deg)";
      }
    }
  });

  return button;
}
function createFaqContent(faq) {
  const content = document.createElement("div");
  content.className = "accordion-content";
  content.style.display = "none";

  const topContent = document.createElement("div");
  topContent.className = "top-content";
  if (faq.description) {
    // Create a temporary div to parse HTML safely
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = faq.description;
    while (tempDiv.firstChild) {
      topContent.appendChild(tempDiv.firstChild);
    }
  }

  content.appendChild(topContent);

  // Add downloads section if assets exist (documents and images)
  if (faq.assets && faq.assets.length > 0) {
    const downloadsWrap = document.createElement("div");
    downloadsWrap.className = "downloads-wrap";

    const downloadsLabel = document.createElement("h4");
    downloadsLabel.className = "downloads-label";
    downloadsLabel.textContent = "Downloads";
    downloadsWrap.appendChild(downloadsLabel);

    faq.assets.forEach((asset) => {
      if (asset.type === "document" || asset.type === "image") {
        const singleItem = document.createElement("div");
        singleItem.className = "single-item";

        const link = document.createElement("a");
        link.href = asset.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        const iconWrap = document.createElement("div");
        iconWrap.className = "icon-wrap";
        const downloadSvg = createDownloadIconSvg(
          24,
          "h-5 w-5",
          "hsl(var(--primary))"
        );
        iconWrap.appendChild(downloadSvg);

        const titleWrap = document.createElement("div");
        titleWrap.className = "title-wrap";
        const title = document.createElement("h6");
        title.className = "title";
        title.textContent = asset.caption || "Download";
        titleWrap.appendChild(title);

        link.appendChild(iconWrap);
        link.appendChild(titleWrap);
        singleItem.appendChild(link);
        downloadsWrap.appendChild(singleItem);
      }
    });

    if (downloadsWrap.children.length > 1) {
      content.appendChild(downloadsWrap);
    }
  }

  // Add bottom content (dates and author)
  const bottomContent = document.createElement("div");
  bottomContent.className = "bottom-content";

  if (faq.created_at) {
    const createdWrap = document.createElement("div");
    createdWrap.className = "created-at-wrap";
    const createdLabel = document.createElement("span");
    createdLabel.className = "main-label";
    createdLabel.textContent = "Created: ";
    const createdDate = document.createElement("span");
    createdDate.textContent = formatDate(faq.created_at);
    createdWrap.appendChild(createdLabel);
    createdWrap.appendChild(createdDate);
    bottomContent.appendChild(createdWrap);

    if (faq.updated_at || faq.author) {
      const separator1 = document.createElement("div");
      separator1.className = "separator updated-at-separator";
      separator1.textContent = "·";
      bottomContent.appendChild(separator1);
    }
  }

  if (faq.updated_at) {
    const updatedWrap = document.createElement("div");
    updatedWrap.className = "updated-at-wrap";
    const updatedLabel = document.createElement("span");
    updatedLabel.className = "main-label";
    updatedLabel.textContent = "Updated: ";
    const updatedDate = document.createElement("span");
    updatedDate.textContent = formatDate(faq.updated_at);
    updatedWrap.appendChild(updatedLabel);
    updatedWrap.appendChild(updatedDate);
    bottomContent.appendChild(updatedWrap);

    if (faq.author) {
      const separator2 = document.createElement("div");
      separator2.className = "separator author-separator";
      separator2.textContent = "·";
      bottomContent.appendChild(separator2);
    }
  }

  if (faq.author) {
    const authorWrap = document.createElement("div");
    authorWrap.className = "author-wrap";
    const authorLabel = document.createElement("span");
    authorLabel.className = "main-label";
    authorLabel.textContent = "Author: ";
    const authorName = document.createElement("span");
    authorName.textContent = faq.author;
    authorWrap.appendChild(authorLabel);
    authorWrap.appendChild(authorName);
    bottomContent.appendChild(authorWrap);
  }

  if (bottomContent.children.length > 0) {
    content.appendChild(bottomContent);
  }

  return content;
}

// ** CREATE FAQ ITEM IN CARDS VIEW **

function createFaqItemInCardsView(groupedFaqs) {
  const cardPanel = document.querySelector('[data-panel-name="cards"]');
  const mainAccordionsWrap = cardPanel?.querySelector(".main-accordions-wrap");

  if (!mainAccordionsWrap) return;

  // Clear existing content
  mainAccordionsWrap.innerHTML = "";

  // Iterate through each category
  Object.values(groupedFaqs).forEach((category) => {
    const accordionItem = document.createElement("div");
    accordionItem.className = "accordion-item";

    const accordionButton = document.createElement("button");
    accordionButton.className = "accordion-button";

    const accordionTitle = document.createElement("h2");
    accordionTitle.className = "accordion-title";
    accordionTitle.textContent = category.title;

    const countSpan = document.createElement("span");
    countSpan.textContent = category.faqs.length;
    accordionTitle.appendChild(countSpan);

    const chevronSvg = createChevronDownSvg();
    accordionButton.appendChild(accordionTitle);
    accordionButton.appendChild(chevronSvg);

    const accordionContentPanel = document.createElement("div");
    accordionContentPanel.className = "accordion-content-panel";
    accordionContentPanel.style.display = "none";

    const gridWrap = document.createElement("div");
    gridWrap.className =
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 grid-wrap";

    // Render each FAQ as a card
    category.faqs.forEach((faq) => {
      const cardItem = document.createElement("div");
      cardItem.className = "single-item transition-shadow shadow-sm";

      const categoryName = document.createElement("div");
      categoryName.className =
        "category-name category-text-color category-bg-color";
      categoryName.textContent = faq.category_title;

      const faqQuestionTitle = document.createElement("h3");
      faqQuestionTitle.className = "faq-question-title";
      faqQuestionTitle.textContent = faq.title;

      const faqDescWrap = document.createElement("div");
      faqDescWrap.className = "faq-desc-wrap";
      // Strip HTML and get first 100 characters
      const textContent = faq.description
        ? faq.description.replace(/<[^>]*>/g, "").substring(0, 100)
        : "";
      faqDescWrap.textContent =
        textContent + (textContent.length >= 100 ? "..." : "");

      const readMoreBtn = document.createElement("button");
      readMoreBtn.className = "read-more-btn";
      readMoreBtn.textContent = "Lees meer ";
      const chevronSvg = createChevronDownExtraSmallSvg();
      readMoreBtn.appendChild(chevronSvg);

      cardItem.appendChild(categoryName);
      cardItem.appendChild(faqQuestionTitle);
      cardItem.appendChild(faqDescWrap);
      cardItem.appendChild(readMoreBtn);

      // Add click handler to open modal
      cardItem.addEventListener("click", function () {
        openCardViewModal(faq);
      });

      gridWrap.appendChild(cardItem);
    });

    accordionContentPanel.appendChild(gridWrap);
    accordionItem.appendChild(accordionButton);
    accordionItem.appendChild(accordionContentPanel);
    mainAccordionsWrap.appendChild(accordionItem);

    // Add click handler for accordion toggle
    accordionButton.addEventListener("click", function () {
      const isHidden = accordionContentPanel.style.display === "none";
      accordionContentPanel.style.display = isHidden ? "block" : "none";
      const svg = accordionButton.querySelector("svg");
      if (svg) {
        svg.style.transform = isHidden ? "rotate(0deg)" : "rotate(-90deg)";
      }
    });
  });
}

// ** CARD VIEW MODAL **

function openCardViewModal(faq) {
  const modalContainer = document.querySelector(".card-view-modal-container");
  if (!modalContainer) return;

  const categoryName = modalContainer.querySelector(".cvf-category-name");
  const questionTitle = modalContainer.querySelector(".cvf--question-title");
  const descWrap = modalContainer.querySelector(".cvf-desc-wrap");
  const footerContent = modalContainer.querySelector(".footer-content");
  const closeBtn = modalContainer.querySelector(".header-wrap svg");

  if (!categoryName || !questionTitle || !descWrap || !footerContent) return;

  // Populate category name
  categoryName.textContent = faq.category_title || "";

  // Populate question title
  questionTitle.textContent = faq.title || "";

  // Populate description (with HTML support)
  descWrap.innerHTML = "";
  if (faq.description) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = faq.description;
    while (tempDiv.firstChild) {
      descWrap.appendChild(tempDiv.firstChild);
    }
  }

  // Add downloads section if assets exist (documents and images)
  const contentWrap = modalContainer.querySelector(".content-wrap");
  if (contentWrap && faq.assets && faq.assets.length > 0) {
    // Remove existing downloads wrap if it exists
    const existingDownloadsWrap = contentWrap.querySelector(".downloads-wrap");
    if (existingDownloadsWrap) {
      existingDownloadsWrap.remove();
    }

    const hasDownloads = faq.assets.some(
      (asset) => asset.type === "document" || asset.type === "image"
    );

    if (hasDownloads) {
      const downloadsWrap = document.createElement("div");
      downloadsWrap.className = "downloads-wrap";

      const downloadsLabel = document.createElement("h4");
      downloadsLabel.className = "downloads-label";
      downloadsLabel.textContent = "Downloads";
      downloadsWrap.appendChild(downloadsLabel);

      faq.assets.forEach((asset) => {
        if (asset.type === "document" || asset.type === "image") {
          const singleItem = document.createElement("div");
          singleItem.className = "single-item";

          const link = document.createElement("a");
          link.href = asset.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";

          const iconWrap = document.createElement("div");
          iconWrap.className = "icon-wrap";
          const downloadSvg = createDownloadIconSvg(
            24,
            "h-5 w-5",
            "hsl(var(--primary))"
          );
          iconWrap.appendChild(downloadSvg);

          const titleWrap = document.createElement("div");
          titleWrap.className = "title-wrap";
          const title = document.createElement("h6");
          title.className = "title";
          title.textContent = asset.caption || "Download";
          titleWrap.appendChild(title);

          link.appendChild(iconWrap);
          link.appendChild(titleWrap);
          singleItem.appendChild(link);
          downloadsWrap.appendChild(singleItem);
        }
      });

      if (downloadsWrap.children.length > 1) {
        contentWrap.insertBefore(downloadsWrap, footerContent);
      }
    }
  }

  // Populate footer content
  footerContent.innerHTML = "";

  if (faq.created_at) {
    const createdWrap = document.createElement("div");
    createdWrap.className = "created-at-wrap";
    const createdLabel = document.createElement("span");
    createdLabel.textContent = "Created: ";
    const createdDate = document.createElement("span");
    createdDate.textContent = formatDate(faq.created_at);
    createdWrap.appendChild(createdLabel);
    createdWrap.appendChild(createdDate);
    footerContent.appendChild(createdWrap);

    if (faq.updated_at || faq.author) {
      const separator1 = document.createElement("div");
      separator1.className = "separator";
      separator1.textContent = "·";
      footerContent.appendChild(separator1);
    }
  }

  if (faq.updated_at) {
    const updatedWrap = document.createElement("div");
    updatedWrap.className = "updated-at-wrap";
    const updatedLabel = document.createElement("span");
    updatedLabel.textContent = "Updated: ";
    const updatedDate = document.createElement("span");
    updatedDate.textContent = formatDate(faq.updated_at);
    updatedWrap.appendChild(updatedLabel);
    updatedWrap.appendChild(updatedDate);
    footerContent.appendChild(updatedWrap);

    if (faq.author) {
      const separator2 = document.createElement("div");
      separator2.className = "separator";
      separator2.textContent = "·";
      footerContent.appendChild(separator2);
    }
  }

  if (faq.author) {
    const authorWrap = document.createElement("div");
    authorWrap.className = "author-wrap";
    const authorLabel = document.createElement("span");
    authorLabel.textContent = "Author: ";
    const authorName = document.createElement("span");
    authorName.textContent = faq.author;
    authorWrap.appendChild(authorLabel);
    authorWrap.appendChild(authorName);
    footerContent.appendChild(authorWrap);
  }

  // Apply display options to footer content
  const createdAt = footerContent.querySelector(".created-at-wrap");
  const updatedAt = footerContent.querySelector(".updated-at-wrap");
  const author = footerContent.querySelector(".author-wrap");
  const separators = footerContent.querySelectorAll(".separator");

  if (createdAt) {
    createdAt.style.display = hide_created_at ? "none" : "block";
  }
  if (updatedAt) {
    updatedAt.style.display = hide_updated_at ? "none" : "block";
  }
  if (author) {
    author.style.display = hide_author ? "none" : "block";
  }

  // Hide separators based on visibility
  separators.forEach((separator) => {
    const prevElement = separator.previousElementSibling;
    const nextElement = separator.nextElementSibling;
    const prevHidden =
      prevElement &&
      ((prevElement.classList.contains("created-at-wrap") && hide_created_at) ||
        (prevElement.classList.contains("updated-at-wrap") &&
          hide_updated_at) ||
        (prevElement.classList.contains("author-wrap") && hide_author));
    const nextHidden =
      nextElement &&
      ((nextElement.classList.contains("created-at-wrap") && hide_created_at) ||
        (nextElement.classList.contains("updated-at-wrap") &&
          hide_updated_at) ||
        (nextElement.classList.contains("author-wrap") && hide_author));

    if (prevHidden || nextHidden) {
      separator.style.display = "none";
    } else {
      separator.style.display = "block";
    }
  });

  // Hide footer if all are hidden
  if (hide_created_at && hide_updated_at && hide_author) {
    footerContent.style.display = "none";
  } else {
    footerContent.style.display = "flex";
  }

  // Show modal
  modalContainer.classList.add("active");

  // Add close handlers (use once to prevent multiple listeners)
  const closeHandler = function (e) {
    e.stopPropagation();
    closeCardViewModal();
  };

  if (closeBtn) {
    closeBtn.removeEventListener("click", closeHandler);
    closeBtn.addEventListener("click", closeHandler);
  }

  const overlay = modalContainer.querySelector(".bg-overlay");
  if (overlay) {
    overlay.removeEventListener("click", closeHandler);
    overlay.addEventListener("click", closeHandler);
  }
}

function closeCardViewModal() {
  const modalContainer = document.querySelector(".card-view-modal-container");
  if (!modalContainer) return;

  modalContainer.classList.remove("active");
}

// ** RENDER CATEGORIES IN DROPDOWN **

function renderCategoriesInDropdown() {
  const filterCategoriesWrap = document.querySelector(
    ".filter-categories-wrap .filter-items"
  );
  if (!filterCategoriesWrap) return;

  // Clear existing checkboxes (except the static ones in HTML if any)
  filterCategoriesWrap.innerHTML = "";

  // Get unique categories from all FAQs
  const categories = [...new Set(allFaqs.map((faq) => faq.category_title))];

  // Create checkbox for each category
  categories.forEach((categoryTitle) => {
    const checkboxItem = document.createElement("div");
    checkboxItem.className = "single-checkbox";
    checkboxItem.setAttribute("data-category", categoryTitle);

    const checkboxIcon = document.createElement("span");
    checkboxIcon.className = "checkbox-icon";

    const checkboxState = document.createElement("span");
    checkboxState.setAttribute("data-state", "unchecked");

    const checkboxSvg = createCheckboxSvg();
    checkboxState.appendChild(checkboxSvg);
    checkboxIcon.appendChild(checkboxState);

    const checkboxText = document.createElement("span");
    checkboxText.className = "checkbox-text";
    checkboxText.textContent = categoryTitle;

    checkboxItem.appendChild(checkboxIcon);
    checkboxItem.appendChild(checkboxText);

    filterCategoriesWrap.appendChild(checkboxItem);
  });
}

// ** INIT FILTER HANDLERS **

function initFilterHandlers() {
  // Handle category checkboxes
  const filterCategoriesWrap = document.querySelector(
    ".filter-categories-wrap .filter-items"
  );
  if (filterCategoriesWrap) {
    filterCategoriesWrap.addEventListener("click", function (e) {
      const checkboxItem = e.target.closest(".single-checkbox");
      if (!checkboxItem) return;

      const categoryTitle = checkboxItem.getAttribute("data-category");
      if (!categoryTitle) return;

      const checkboxState = checkboxItem.querySelector("[data-state]");
      const isChecked = checkboxState.getAttribute("data-state") === "checked";

      // Toggle checkbox state
      if (isChecked) {
        checkboxState.setAttribute("data-state", "unchecked");
        filterState.selectedCategories = filterState.selectedCategories.filter(
          (cat) => cat !== categoryTitle
        );
      } else {
        checkboxState.setAttribute("data-state", "checked");
        if (!filterState.selectedCategories.includes(categoryTitle)) {
          filterState.selectedCategories.push(categoryTitle);
        }
      }

      updateFilterButtonState();
      applyFilters();
    });
  }

  // Handle attachments checkbox
  const filterAttachmentsWrap = document.querySelector(
    ".filter-attachments-wrap .filter-items"
  );
  if (filterAttachmentsWrap) {
    filterAttachmentsWrap.addEventListener("click", function (e) {
      const checkboxItem = e.target.closest(".single-checkbox");
      if (!checkboxItem) return;

      const checkboxState = checkboxItem.querySelector("[data-state]");
      const isChecked = checkboxState.getAttribute("data-state") === "checked";

      // Toggle checkbox state
      if (isChecked) {
        checkboxState.setAttribute("data-state", "unchecked");
        filterState.showOnlyWithAttachments = false;
      } else {
        checkboxState.setAttribute("data-state", "checked");
        filterState.showOnlyWithAttachments = true;
      }

      updateFilterButtonState();
      applyFilters();
    });
  }

  // Handle clear all button
  const clearAllBtn = document.querySelector(".clear-all");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", function () {
      // Reset filter state
      filterState.selectedCategories = [];
      filterState.showOnlyWithAttachments = false;
      filterState.searchQuery = "";

      // Reset all checkboxes
      const allCheckboxes = document.querySelectorAll(
        ".single-checkbox [data-state]"
      );
      allCheckboxes.forEach((checkbox) => {
        checkbox.setAttribute("data-state", "unchecked");
      });

      // Clear search input
      const searchInput = document.querySelector(".search-input");
      if (searchInput) {
        searchInput.value = "";
      }

      updateFilterButtonState();
      applyFilters();
    });
  }
}

// ** UPDATE FILTER BUTTON STATE **

function updateFilterButtonState() {
  const filterDropdownBtn = document.querySelector(".filter-dropdown-btn");
  if (!filterDropdownBtn) return;

  const hasActiveFilters =
    filterState.selectedCategories.length > 0 ||
    filterState.showOnlyWithAttachments;

  if (hasActiveFilters) {
    filterDropdownBtn.classList.add("active");
  } else {
    filterDropdownBtn.classList.remove("active");
  }
}

// ** APPLY FILTERS **

function applyFilters() {
  let filteredFaqs = [...allFaqs];

  // Filter by search query (search in FAQ title/question)
  if (filterState.searchQuery) {
    filteredFaqs = filteredFaqs.filter((faq) => {
      const title = faq.title ? faq.title.toLowerCase() : "";
      return title.includes(filterState.searchQuery);
    });
  }

  // Filter by selected categories
  if (filterState.selectedCategories.length > 0) {
    filteredFaqs = filteredFaqs.filter((faq) =>
      filterState.selectedCategories.includes(faq.category_title)
    );
  }

  // Filter by attachments
  if (filterState.showOnlyWithAttachments) {
    filteredFaqs = filteredFaqs.filter(
      (faq) => faq.assets && faq.assets.length > 0
    );
  }

  // Group filtered FAQs
  groupedFaqs = groupFaqsByCategory(filteredFaqs);

  // Show/hide no results message
  const noResultWrap = document.querySelector(".no-result-match-wrap");
  if (noResultWrap) {
    if (filteredFaqs.length === 0) {
      noResultWrap.classList.add("active");
    } else {
      noResultWrap.classList.remove("active");
    }
  }

  // Re-render FAQs
  createFaqItemInListView(groupedFaqs);
  createFaqItemInCardsView(groupedFaqs);

  // Update filter button state
  updateFilterButtonState();

  // Re-apply display options
  handleDudaContentEditorOptions();
}

// ** HANDLE DUDACONTENTEDITOR OPTIONS **

function handleDudaContentEditorOptions() {
  // add dark-mode class on lx-faq-main-wrap if dark_mode is true
  const faqMainWrap = document.querySelector(".lx-faq-main-wrap");
  dark_mode
    ? faqMainWrap.classList.add("dark-mode")
    : faqMainWrap.classList.remove("dark-mode");

  // add dark-mode class on modal container if dark_mode is true
  const modalContainer = document.querySelector(".card-view-modal-container");
  if (modalContainer) {
    dark_mode
      ? modalContainer.classList.add("dark-mode")
      : modalContainer.classList.remove("dark-mode");
  }

  // hide search-bar-outer-wrap if hide_search_bar is true
  const searchBarOuterWrap = document.querySelector(".search-bar-outer-wrap");
  hide_search_bar
    ? (searchBarOuterWrap.style.display = "none")
    : (searchBarOuterWrap.style.display = "block");

  // hide created-at if hide_created_at is true
  const createdAt = document.querySelectorAll(".created-at-wrap");
  createdAt.forEach((item) => {
    item.style.display = hide_created_at ? "none" : "block";
  });

  // hide updated-at if hide_updated_at is true
  const updatedAt = document.querySelectorAll(".updated-at-wrap");
  const updatedAtSeparators = document.querySelectorAll(
    ".updated-at-separator"
  );
  updatedAt.forEach((item) => {
    item.style.display = hide_updated_at ? "none" : "block";
  });
  updatedAtSeparators.forEach((item) => {
    item.style.display = hide_updated_at || hide_created_at ? "none" : "block";
  });

  // hide author if hide_author is true
  const author = document.querySelectorAll(".author-wrap");
  const authorSeparators = document.querySelectorAll(".author-separator");
  author.forEach((item) => {
    item.style.display = hide_author ? "none" : "block";
  });
  authorSeparators.forEach((item) => {
    item.style.display = hide_author || hide_updated_at ? "none" : "block";
  });

  // if created-at, updated-at and author are all true, hide all bottom-content elements
  const bottomContent = document.querySelectorAll(".bottom-content");
  if (hide_created_at && hide_updated_at && hide_author) {
    bottomContent.forEach((item) => {
      item.style.display = "none";
    });
  } else {
    bottomContent.forEach((item) => {
      item.style.display = "flex";
    });
  }

  // if collapse categories is true, show all accordion content panels
  if (collapse_categories) {
    const accordionContentPanels = document.querySelectorAll(
      ".accordion-content-panel"
    );
    const accordionButtons = document.querySelectorAll(".accordion-button");
    accordionContentPanels.forEach((panel) => {
      panel.style.display = "block";
    });
    accordionButtons.forEach((button) => {
      const svg = button.querySelector("svg");
      if (svg) {
        svg.style.transform = "rotate(0deg)";
      }
    });
  }

  // Set default view based on device type (already handled in initViewToggle)
}

// ** HELPER FUNCTIONS **

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
function groupFaqsByCategory(faqs) {
  const grouped = {};

  faqs.forEach((faq) => {
    const categoryTitle = faq.category_title;

    // If category doesn't exist, create it
    if (!grouped[categoryTitle]) {
      grouped[categoryTitle] = {
        title: categoryTitle,
        id: faq.category_id,
        category_subtitle: faq.category_subtitle, // Add subtitle from first FAQ
        faqs: [],
      };
    }

    // Add FAQ to the category
    grouped[categoryTitle].faqs.push(faq);
  });

  return grouped;
}

// ** SVGs HELPER FUNCTIONS **

function createChevronDownSvg(size = 24, classes = "h-5 w-5") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute(
    "class",
    `lucide lucide-chevron-down ${classes} transition-transform -rotate-90`
  );
  svg.setAttribute("aria-hidden", "true");
  svg.style.color = "rgb(95, 95, 95)";

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "m6 9 6 6 6-6");
  svg.appendChild(path);

  return svg;
}
function createChevronDownSmallSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "15");
  svg.setAttribute("height", "15");
  svg.setAttribute("viewBox", "0 0 15 15");
  svg.setAttribute("fill", "none");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute(
    "class",
    "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
  );

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
  );
  path.setAttribute("fill", "currentColor");
  path.setAttribute("fill-rule", "evenodd");
  path.setAttribute("clip-rule", "evenodd");
  svg.appendChild(path);

  return svg;
}
function createChevronDownExtraSmallSvg() {
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
  svg.setAttribute("class", "lucide lucide-chevron-down h-3 w-3");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "m6 9 6 6 6-6");
  svg.appendChild(path);

  return svg;
}
function createDownloadIconSvg(
  size = 24,
  classes = "h-4 w-4 flex-shrink-0",
  color = "hsl(var(--muted-foreground))"
) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("class", `lucide lucide-download ${classes}`);
  svg.setAttribute("aria-hidden", "true");
  svg.style.color = color;

  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("d", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4");
  svg.appendChild(path1);

  const polyline = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polyline"
  );
  polyline.setAttribute("points", "7 10 12 15 17 10");
  svg.appendChild(polyline);

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", "12");
  line.setAttribute("x2", "12");
  line.setAttribute("y1", "15");
  line.setAttribute("y2", "3");
  svg.appendChild(line);

  return svg;
}
function createCheckboxSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "15");
  svg.setAttribute("height", "15");
  svg.setAttribute("viewBox", "0 0 15 15");
  svg.setAttribute("fill", "none");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("class", "h-4 w-4");

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

// ---------- INITIALIZATION ---------- //

initViewToggle();
getFaqs();
