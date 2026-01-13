import { data, collectionData } from "./dummyData.js";

// GLOBAL VARIABLES

let cancelledMatchesData = [];
let currentDate = new Date();

// DUDA CONTENT EDITOR SETTINGS

const device = data.device;
const darkMode = data.config.dark_mode;
const hideWidgetTitle = data.config.hide_widget_title;
const viewAllCancellationsLink =
  data.config.view_all_cancellations_link &&
  data.config.view_all_cancellations_link.href
    ? data.config.view_all_cancellations_link.href
    : null;

// ---------- FETCH CANCELLED MATCHES ---------- //

function fetchCancelledMatches() {
  // Show loader and hide content initially
  showLoader();

  const apiUrl = data.config.api_url;
  const apiToken = data.config.api_token;

  if (!apiUrl || !apiToken) {
    console.error("API URL or token is missing in configuration");

    // Still need to handle Duda editor settings and show no matches message
    handleDudaContentEditorSettings();
    renderCancelledMatchesInCarousel();

    hideLoader();
    return;
  }

  var settings = {
    async: true,
    crossDomain: true,
    url: apiUrl,
    method: "GET",
    headers: {
      authorization: `Basic ${apiToken}`,
      "cache-control": "no-cache",
    },
  };

  $.ajax(settings)
    .done(function (apiData) {
      // Transform API response to match expected collection data structure
      // API returns: { match_days: [{ date, matches, matches_count, all_matches_cancelled }, ...] }
      // Expected format: [{ uuid, data: { date, matches, ... }, correlationId, page_item_url }, ...]
      if (apiData.match_days && Array.isArray(apiData.match_days)) {
        // Transform match_days to expected format
        cancelledMatchesData = apiData.match_days.map(function (matchDay) {
          // Generate a simple UUID-like identifier from the date
          const dateStr = matchDay.date || "";
          const uuid =
            dateStr.replace(/[^a-zA-Z0-9]/g, "").substring(0, 32) ||
            Math.random().toString(36).substring(2, 15);

          return {
            uuid: uuid,
            data: {
              date: matchDay.date,
              matches: matchDay.matches || [],
              matches_count: matchDay.matches_count || 0,
              all_matches_cancelled: matchDay.all_matches_cancelled || false,
            },
            correlationId: matchDay.date,
            page_item_url: matchDay.date,
          };
        });
      } else if (Array.isArray(apiData)) {
        cancelledMatchesData = apiData;
      } else if (apiData.data && Array.isArray(apiData.data)) {
        cancelledMatchesData = apiData.data;
      } else if (apiData.collection && Array.isArray(apiData.collection)) {
        cancelledMatchesData = apiData.collection;
      } else {
        // If API returns a different structure, wrap it in the expected format
        cancelledMatchesData = [apiData];
      }

      // Check if API returned no matches, use dummy data as fallback
      const hasMatches = cancelledMatchesData.some(function (matchDay) {
        return (
          matchDay.data &&
          matchDay.data.matches &&
          Array.isArray(matchDay.data.matches) &&
          matchDay.data.matches.length > 0
        );
      });

      if (!hasMatches && collectionData && collectionData.my_collection) {
        console.log("No matches found in API response, using dummy data");
        cancelledMatchesData = collectionData.my_collection;
      }

      // Always set current date to today's date
      currentDate = new Date();

      handleDudaContentEditorSettings();

      // Render matches in carousel
      renderCancelledMatchesInCarousel();

      // Hide loader and show content after data is loaded
      hideLoader();
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error(
        "Error fetching cancelled matches from API:",
        textStatus,
        errorThrown
      );

      // Use dummy data as fallback when API fails
      if (collectionData && collectionData.my_collection) {
        console.log("API request failed, using dummy data");
        cancelledMatchesData = collectionData.my_collection;

        currentDate = new Date();
        handleDudaContentEditorSettings();
        renderCancelledMatchesInCarousel();
      }

      // Hide loader even on error
      hideLoader();
    });
}

// ---------- RENDERING FUNCTIONS ---------- //

function getMatchesForDisplay() {
  if (!cancelledMatchesData || !Array.isArray(cancelledMatchesData)) {
    return { matches: [], date: null, isToday: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find matches for today
  let todayMatches = [];
  let todayMatchDay = null;

  cancelledMatchesData.forEach(function (matchDay) {
    if (
      matchDay.data &&
      matchDay.data.matches &&
      Array.isArray(matchDay.data.matches) &&
      matchDay.data.matches.length > 0
    ) {
      const matchDate = new Date(matchDay.data.date);
      matchDate.setHours(0, 0, 0, 0);

      if (matchDate.getTime() === today.getTime()) {
        todayMatchDay = matchDay;
        todayMatches = matchDay.data.matches.map(function (match) {
          return {
            ...match,
            matchDate: matchDay.data.date,
          };
        });
      }
    }
  });

  // If we have matches for today, return them
  if (todayMatches.length > 0) {
    return {
      matches: todayMatches,
      date: todayMatchDay.data.date,
      isToday: true,
    };
  }

  // Otherwise, find the next available date with matches
  const sortedMatchDays = cancelledMatchesData
    .filter(function (matchDay) {
      return (
        matchDay.data &&
        matchDay.data.matches &&
        Array.isArray(matchDay.data.matches) &&
        matchDay.data.matches.length > 0
      );
    })
    .sort(function (a, b) {
      const dateA = new Date(a.data.date);
      const dateB = new Date(b.data.date);
      return dateA - dateB;
    });

  if (sortedMatchDays.length > 0) {
    const nextMatchDay = sortedMatchDays[0];
    const nextMatches = nextMatchDay.data.matches.map(function (match) {
      return {
        ...match,
        matchDate: nextMatchDay.data.date,
      };
    });
    return {
      matches: nextMatches,
      date: nextMatchDay.data.date,
      isToday: false,
    };
  }

  return { matches: [], date: null, isToday: false };
}

function getMatchCounts() {
  if (!cancelledMatchesData || !Array.isArray(cancelledMatchesData)) {
    return { todayCount: 0, laterThisWeekCount: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate end of week (Sunday)
  const endOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  endOfWeek.setDate(today.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);

  let todayCount = 0;
  let laterThisWeekCount = 0;

  cancelledMatchesData.forEach(function (matchDay) {
    if (
      matchDay.data &&
      matchDay.data.matches &&
      Array.isArray(matchDay.data.matches)
    ) {
      const matchDate = new Date(matchDay.data.date);
      matchDate.setHours(0, 0, 0, 0);

      const matchCount = matchDay.data.matches.length;

      if (matchDate.getTime() === today.getTime()) {
        todayCount += matchCount;
      } else if (matchDate > today && matchDate <= endOfWeek) {
        laterThisWeekCount += matchCount;
      }
    }
  });

  return { todayCount, laterThisWeekCount };
}

function updateCarouselInfoWrap() {
  const carouselInfoWrap = document.querySelector(
    ".cancelled-matches-carousel .carousel-info-wrap"
  );

  if (!carouselInfoWrap) return;

  const { todayCount, laterThisWeekCount } = getMatchCounts();
  const todayMatchesElement = carouselInfoWrap.querySelector(
    ".total-carousel-matches"
  );
  const laterThisWeekMatchesElement = carouselInfoWrap.querySelector(
    ".total-cancelled-matches"
  );

  // Update today's count
  if (todayMatchesElement) {
    if (todayCount === 1) {
      todayMatchesElement.textContent = "1 cancellation today";
    } else if (todayCount > 1) {
      todayMatchesElement.textContent = `${todayCount} cancellations today`;
    } else {
      todayMatchesElement.textContent = "0 cancellations today";
    }
  }

  // Update later this week count
  if (laterThisWeekMatchesElement) {
    if (laterThisWeekCount === 0) {
      laterThisWeekMatchesElement.textContent =
        "0 cancellations later this week";
    } else if (laterThisWeekCount === 1) {
      laterThisWeekMatchesElement.textContent =
        "1 cancellation later this week";
    } else {
      laterThisWeekMatchesElement.textContent = `${laterThisWeekCount} cancellations later this week`;
    }
  }
}

function updateCancellationDateLabel(dateString, isToday) {
  const cancellationForWrap = document.querySelector(
    ".cancelled-matches-carousel .cancellation-for-wrap"
  );

  if (!cancellationForWrap) return;

  // Only show the label if matches are NOT for today
  if (isToday) {
    cancellationForWrap.style.display = "none";
  } else {
    cancellationForWrap.style.display = "block";
    const dateElement = cancellationForWrap.querySelector(
      ".cancellation-for-date"
    );
    if (dateElement && dateString) {
      dateElement.textContent = formatDateLabel(dateString);
    }
  }
}

function updateViewAllLink() {
  const viewAllWrap = document.querySelector(
    ".cancelled-matches-carousel .view-all-wrap"
  );

  if (!viewAllWrap) return;

  const viewAllLink = viewAllWrap.querySelector(".view-all-link");

  if (!viewAllLink) return;

  // Check if link is available and not empty
  if (viewAllCancellationsLink && viewAllCancellationsLink !== null) {
    viewAllLink.href = viewAllCancellationsLink;
    viewAllWrap.style.display = "block";
  } else {
    viewAllWrap.style.display = "none";
  }
}

function hasAnyMatches() {
  if (!cancelledMatchesData || !Array.isArray(cancelledMatchesData)) {
    return false;
  }

  // Check if there are any matches in any match day
  return cancelledMatchesData.some(function (matchDay) {
    return (
      matchDay.data &&
      matchDay.data.matches &&
      Array.isArray(matchDay.data.matches) &&
      matchDay.data.matches.length > 0
    );
  });
}

function showNoMatchesMessage() {
  const cancelledMatchesCarousel = document.querySelector(
    ".cancelled-matches-carousel"
  );
  const dudaEditorMessageWrap = document.querySelector(
    ".cancelled-matches-carousel .duda-editor-message-wrap"
  );

  if (cancelledMatchesCarousel) {
    // Hide all carousel content
    const carouselInfoWrap = cancelledMatchesCarousel.querySelector(
      ".carousel-info-wrap"
    );
    const cancellationForWrap = cancelledMatchesCarousel.querySelector(
      ".cancellation-for-wrap"
    );
    const carouselContainer = cancelledMatchesCarousel.querySelector(
      ".carousel-container"
    );
    const viewAllWrap =
      cancelledMatchesCarousel.querySelector(".view-all-wrap");

    if (carouselInfoWrap) carouselInfoWrap.style.display = "none";
    if (cancellationForWrap) cancellationForWrap.style.display = "none";
    if (carouselContainer) carouselContainer.style.display = "none";
    if (viewAllWrap) viewAllWrap.style.display = "none";
  }

  // Show Duda editor message when there are no matches
  if (dudaEditorMessageWrap && data.inEditor) {
    dudaEditorMessageWrap.classList.add("editorBody");
  }
}

function hideNoMatchesMessage() {
  const cancelledMatchesCarousel = document.querySelector(
    ".cancelled-matches-carousel"
  );
  const dudaEditorMessageWrap = document.querySelector(
    ".cancelled-matches-carousel .duda-editor-message-wrap"
  );

  if (cancelledMatchesCarousel) {
    // Show all carousel content
    const carouselInfoWrap = cancelledMatchesCarousel.querySelector(
      ".carousel-info-wrap"
    );
    const cancellationForWrap = cancelledMatchesCarousel.querySelector(
      ".cancellation-for-wrap"
    );
    const carouselContainer = cancelledMatchesCarousel.querySelector(
      ".carousel-container"
    );
    const viewAllWrap =
      cancelledMatchesCarousel.querySelector(".view-all-wrap");

    if (carouselInfoWrap) carouselInfoWrap.style.display = "flex";
    if (cancellationForWrap) cancellationForWrap.style.display = "block";
    if (carouselContainer) carouselContainer.style.display = "block";
    if (viewAllWrap) viewAllWrap.style.display = "block";
  }

  // Hide Duda editor message when matches are found and in editor mode
  if (dudaEditorMessageWrap) {
    if (data.inEditor) {
      dudaEditorMessageWrap.classList.remove("editorBody");
    }
  }
}

function renderCancelledMatchesInCarousel() {
  const matchesCarousel = document.querySelector(
    ".cancelled-matches-carousel .matches-carousel"
  );

  if (!matchesCarousel) {
    console.error("Matches carousel element not found");
    return;
  }

  matchesCarousel.innerHTML = "";

  // Check if there are any matches at all (today or future)
  if (!hasAnyMatches()) {
    console.warn("No matches available (today or future)");
    showNoMatchesMessage();
    return;
  }

  // Hide the no matches message if we have matches
  hideNoMatchesMessage();

  // Update view all link (regardless of whether there are matches)
  updateViewAllLink();

  // Get matches for display (today first, or next available date)
  const { matches, date, isToday } = getMatchesForDisplay();

  if (matches.length === 0) {
    console.warn("No matches available for display");
    return;
  }

  // Update cancellation date label
  updateCancellationDateLabel(date, isToday);

  // Update carousel info wrap (today count and later this week count)
  updateCarouselInfoWrap();

  // Render each match
  matches.forEach(function (match) {
    const matchElement = createMatchElement(match);
    matchesCarousel.appendChild(matchElement);
  });

  // Only initialize carousel if there are more matches than visible items
  // Mobile: 1 item visible, so carousel works if matches > 1
  // Tablet: 2 items visible, so carousel works if matches > 2
  // Desktop: 3 items visible, so carousel works if matches > 3
  const matchesPerView = getItemsPerView();
  if (matches.length > matchesPerView) {
    initializeCarousel();
    // Use setTimeout to ensure viewport is measured correctly after render
    setTimeout(function () {
      updateCarouselDots(matches.length);
    }, 100);
  } else {
    disableCarousel();
    hideCarouselDots();
  }
}

function createMatchElement(match) {
  const singleMatch = document.createElement("div");
  singleMatch.className = "single-match";

  const innerWrap = document.createElement("div");
  innerWrap.className = "inner-wrap";

  // Top wrap with teams
  const topWrap = document.createElement("div");
  topWrap.className = "top-wrap";

  // Home team
  const homeTeamWrap = document.createElement("div");
  homeTeamWrap.className = "home-team-wrap team-wrap";

  const homeTeamImg = document.createElement("img");
  homeTeamImg.src = "https://github.com/polymet-ai.png";
  homeTeamImg.alt = "Home Team";

  const homeTeamNameWrap = document.createElement("div");
  homeTeamNameWrap.className = "team-name-wrap";

  const homeTeamName = document.createElement("div");
  homeTeamName.className = "home-team-name main-name";
  homeTeamName.textContent = match.home_team_name || "";

  const homeTeamLabel = document.createElement("div");
  homeTeamLabel.className = "home-team-label main-label";
  homeTeamLabel.textContent = match.home_team_label || "";

  homeTeamNameWrap.appendChild(homeTeamName);
  homeTeamNameWrap.appendChild(homeTeamLabel);
  homeTeamWrap.appendChild(homeTeamImg);
  homeTeamWrap.appendChild(homeTeamNameWrap);

  // VS
  const vsWrap = document.createElement("div");
  vsWrap.className = "vs-wrap";
  vsWrap.textContent = "vs";

  // Away team
  const awayTeamWrap = document.createElement("div");
  awayTeamWrap.className = "away-team-wrap team-wrap";

  const awayTeamImg = document.createElement("img");
  awayTeamImg.src = "https://github.com/polymet-ai.png";
  awayTeamImg.alt = "Away Team";

  const awayTeamNameWrap = document.createElement("div");
  awayTeamNameWrap.className = "team-name-wrap";

  const awayTeamName = document.createElement("div");
  awayTeamName.className = "away-team-name main-name";
  awayTeamName.textContent = match.opponent_team_name || "";

  const awayTeamLabel = document.createElement("div");
  awayTeamLabel.className = "away-team-label main-label";
  awayTeamLabel.textContent = match.away_team_label || "";

  awayTeamNameWrap.appendChild(awayTeamName);
  awayTeamNameWrap.appendChild(awayTeamLabel);
  awayTeamWrap.appendChild(awayTeamImg);
  awayTeamWrap.appendChild(awayTeamNameWrap);

  topWrap.appendChild(homeTeamWrap);
  topWrap.appendChild(vsWrap);
  topWrap.appendChild(awayTeamWrap);

  // Bottom wrap with match details
  const bottomWrap = document.createElement("div");
  bottomWrap.className = "bottom-wrap";

  const bottomInnerWrap = document.createElement("div");
  bottomInnerWrap.className = "bottom-inner-wrap";

  const matchDate = document.createElement("span");
  matchDate.className = "match-date";
  matchDate.textContent = formatDateOnly(match.matchDate);

  const dot1 = document.createElement("span");
  dot1.className = "dot";
  dot1.textContent = "·";

  const matchTimeDate = document.createElement("span");
  matchTimeDate.className = "match-time-date";
  matchTimeDate.textContent = match.time || "";

  const dot2 = document.createElement("span");
  dot2.className = "dot";
  dot2.textContent = "·";

  const matchField = document.createElement("span");
  matchField.className = "match-field";
  matchField.textContent = match.field || "";

  const dot3 = document.createElement("span");
  dot3.className = "dot";
  dot3.textContent = "·";

  const matchCancelledReason = document.createElement("span");
  matchCancelledReason.className = "match-cancelled-reason";
  matchCancelledReason.textContent = match.cancellation_reason || "";

  bottomInnerWrap.appendChild(matchDate);
  bottomInnerWrap.appendChild(dot1);
  bottomInnerWrap.appendChild(matchTimeDate);
  bottomInnerWrap.appendChild(dot2);
  bottomInnerWrap.appendChild(matchField);
  bottomInnerWrap.appendChild(dot3);
  bottomWrap.appendChild(bottomInnerWrap);
  bottomWrap.appendChild(matchCancelledReason);

  innerWrap.appendChild(topWrap);
  innerWrap.appendChild(bottomWrap);
  singleMatch.appendChild(innerWrap);

  return singleMatch;
}

// ---------- CAROUSEL FUNCTIONALITY ---------- //

// Global flag to track programmatic scrolling
let isProgrammaticScroll = false;
let autoPlayInterval = null;
let autoPlayPaused = false;
const AUTO_PLAY_DELAY = 4000; // 4 seconds between slides
const AUTO_PLAY_PAUSE_ON_HOVER = true;

function getItemsPerView() {
  const width = window.innerWidth;
  if (width < 640) {
    return 1; // Mobile: 1 item
  } else if (width < 1024) {
    return 2; // Tablet: 2 items
  }
  return 3; // Desktop: exactly 3 items (no half cards)
}

function getScrollAmount() {
  const matchesCarousel = document.querySelector(
    ".cancelled-matches-carousel .matches-carousel"
  );
  if (!matchesCarousel) return 0;

  const width = window.innerWidth;
  const containerWidth = matchesCarousel.clientWidth;

  // With CSS Grid, calculate based on grid column width
  if (width < 640) {
    // Mobile: 100% per item
    return containerWidth;
  } else if (width < 1024) {
    // Tablet: 50% per item (2 items visible)
    return containerWidth * 0.5;
  }
  // Desktop: 33.33% per item (3 items visible)
  return containerWidth / 3;
}

function updateCarouselDots(totalMatches, scrollToPage) {
  const carouselDotsWrap = document.querySelector(
    ".cancelled-matches-carousel .carousel-dots-wrap"
  );
  const matchesCarousel = document.querySelector(
    ".cancelled-matches-carousel .matches-carousel"
  );

  if (!carouselDotsWrap || !matchesCarousel) return;

  // Calculate number of pages based on viewport width
  const matchesPerView = getItemsPerView();
  // When scrolling by 1 match at a time, number of positions = totalMatches - matchesPerView + 1
  // Example: 4 matches, show 3 at a time = positions: 0 (1-2-3), 1 (2-3-4) = 2 dots
  const totalPages =
    totalMatches > matchesPerView ? totalMatches - matchesPerView + 1 : 1;

  // Clear existing dots
  carouselDotsWrap.innerHTML = "";

  // Scroll by 1 match at a time - use grid-based calculation
  const scrollAmountPerMatch = getScrollAmount();

  // Create dots based on number of pages
  for (let i = 0; i < totalPages; i++) {
    const dot = document.createElement("div");
    dot.className = "carousel-dot";
    dot.style.cursor = "pointer";
    if (i === 0) {
      dot.classList.add("active");
    }

    // Add click handler to navigate to specific page
    dot.addEventListener("click", function () {
      // Pause auto-play when user clicks dot
      pauseAutoPlay();

      // Set flag to prevent scroll listener from interfering
      isProgrammaticScroll = true;

      // Immediately update active dot on click
      const dots = carouselDotsWrap.querySelectorAll(".carousel-dot");
      dots.forEach(function (d, idx) {
        if (idx === i) {
          d.classList.add("active");
        } else {
          d.classList.remove("active");
        }
      });

      // Scroll by 1 match per position: position 0 = 0, position 1 = 1 match, etc.
      const currentScrollAmount = getScrollAmount();
      const targetScroll = i * currentScrollAmount;
      matchesCarousel.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });

      // Reset flag after scroll animation completes
      setTimeout(function () {
        isProgrammaticScroll = false;
        // Resume auto-play after delay
        setTimeout(function () {
          resumeAutoPlay();
        }, AUTO_PLAY_DELAY * 2);
      }, 350);
    });

    carouselDotsWrap.appendChild(dot);
  }
}

function hideCarouselDots() {
  const carouselDotsWrap = document.querySelector(
    ".cancelled-matches-carousel .carousel-dots-wrap"
  );

  if (carouselDotsWrap) {
    carouselDotsWrap.style.display = "none";
  }
}

function disableCarousel() {
  const matchesCarousel = document.querySelector(
    ".cancelled-matches-carousel .matches-carousel"
  );
  const carouselContainer = document.querySelector(
    ".cancelled-matches-carousel .carousel-container"
  );
  const prevButton = document.querySelector(
    ".cancelled-matches-carousel .carousel-button.prev"
  );
  const nextButton = document.querySelector(
    ".cancelled-matches-carousel .carousel-button.next"
  );

  // Hide navigation buttons
  if (prevButton) prevButton.style.display = "none";
  if (nextButton) nextButton.style.display = "none";

  // Remove overflow and center items
  if (matchesCarousel) {
    matchesCarousel.style.overflowX = "visible";
    matchesCarousel.style.maxWidth = "none";
    matchesCarousel.style.padding = "0";
  }

  if (carouselContainer) {
    carouselContainer.style.overflow = "visible";
  }
}

function initializeCarousel() {
  const matchesCarousel = document.querySelector(
    ".cancelled-matches-carousel .matches-carousel"
  );
  const prevButton = document.querySelector(
    ".cancelled-matches-carousel .carousel-button.prev"
  );
  const nextButton = document.querySelector(
    ".cancelled-matches-carousel .carousel-button.next"
  );
  const carouselDotsWrap = document.querySelector(
    ".cancelled-matches-carousel .carousel-dots-wrap"
  );

  if (!matchesCarousel || !prevButton || !nextButton) {
    return;
  }

  // Remove existing event listeners by cloning and replacing
  const newPrevButton = prevButton.cloneNode(true);
  const newNextButton = nextButton.cloneNode(true);

  // Ensure buttons are visible after cloning
  newPrevButton.style.display = "flex";
  newNextButton.style.display = "flex";

  prevButton.parentNode.replaceChild(newPrevButton, prevButton);
  nextButton.parentNode.replaceChild(newNextButton, nextButton);

  // Get updated button references after replacement
  const updatedPrevButton = document.querySelector(
    ".cancelled-matches-carousel .carousel-button.prev"
  );
  const updatedNextButton = document.querySelector(
    ".cancelled-matches-carousel .carousel-button.next"
  );

  // Use the updated buttons for event handlers
  const activePrevButton = updatedPrevButton || newPrevButton;
  const activeNextButton = updatedNextButton || newNextButton;

  // Show dots
  if (carouselDotsWrap) carouselDotsWrap.style.display = "flex";

  const matchesPerView = getItemsPerView();
  // Scroll by 1 match at a time - calculated based on grid column width

  function updateButtons() {
    const currentScroll = matchesCarousel.scrollLeft;
    const maxScroll = matchesCarousel.scrollWidth - matchesCarousel.clientWidth;

    // Use a small threshold to handle floating point precision
    const isAtStart = currentScroll <= 1;
    const isAtEnd = currentScroll >= maxScroll - 1;

    activePrevButton.style.opacity = isAtStart ? "0.3" : "1";
    activePrevButton.disabled = isAtStart;
    activeNextButton.style.opacity = isAtEnd ? "0.3" : "1";
    activeNextButton.disabled = isAtEnd;
  }

  function updateActiveDot() {
    const carouselDotsWrap = document.querySelector(
      ".cancelled-matches-carousel .carousel-dots-wrap"
    );
    if (!carouselDotsWrap) return;

    const currentScroll = matchesCarousel.scrollLeft;
    // Scroll by 1 match at a time, so calculate position based on grid column width
    const currentScrollAmount = getScrollAmount();
    const scrollPerPage = currentScrollAmount;

    // Calculate which page we're on (round to nearest)
    const currentPage = Math.round(currentScroll / scrollPerPage);
    const dots = carouselDotsWrap.querySelectorAll(".carousel-dot");

    dots.forEach(function (dot, index) {
      if (index === currentPage) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
  }

  function scrollCarousel(direction) {
    const currentScroll = matchesCarousel.scrollLeft;
    const maxScroll = matchesCarousel.scrollWidth - matchesCarousel.clientWidth;

    // Scroll by 1 match at a time - get current scroll amount based on grid
    const currentScrollAmount = getScrollAmount();

    let newScrollPosition;

    if (direction === "next") {
      // Calculate the next snap position to ensure we always show full items
      const currentIndex = Math.round(currentScroll / currentScrollAmount);
      newScrollPosition = Math.min(
        (currentIndex + 1) * currentScrollAmount,
        maxScroll
      );
    } else {
      // Calculate the previous snap position
      const currentIndex = Math.round(currentScroll / currentScrollAmount);
      newScrollPosition = Math.max((currentIndex - 1) * currentScrollAmount, 0);
    }

    // Set flag to prevent scroll listener from interfering
    isProgrammaticScroll = true;

    matchesCarousel.scrollTo({
      left: newScrollPosition,
      behavior: "smooth",
    });

    // Update button states and active dot after scroll animation
    setTimeout(function () {
      updateButtons();
      updateActiveDot();
      isProgrammaticScroll = false;
    }, 350);
  }

  // Auto-play functions
  function startAutoPlay() {
    // Only start auto-play if there are more items than visible
    const totalMatches =
      matchesCarousel.querySelectorAll(".single-match").length;
    const matchesPerView = getItemsPerView();

    if (totalMatches <= matchesPerView) {
      return; // Don't auto-play if all items are visible
    }

    // Clear any existing interval
    stopAutoPlay();

    autoPlayInterval = setInterval(function () {
      if (!autoPlayPaused) {
        const currentScroll = matchesCarousel.scrollLeft;
        const maxScroll =
          matchesCarousel.scrollWidth - matchesCarousel.clientWidth;
        const isAtEnd = currentScroll >= maxScroll - 1;

        if (isAtEnd) {
          // Loop back to the beginning
          isProgrammaticScroll = true;
          matchesCarousel.scrollTo({
            left: 0,
            behavior: "smooth",
          });
          setTimeout(function () {
            updateButtons();
            updateActiveDot();
            isProgrammaticScroll = false;
          }, 350);
        } else {
          scrollCarousel("next");
        }
      }
    }, AUTO_PLAY_DELAY);
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }

  function pauseAutoPlay() {
    autoPlayPaused = true;
  }

  function resumeAutoPlay() {
    autoPlayPaused = false;
  }

  // Start auto-play
  startAutoPlay();

  activePrevButton.addEventListener("click", function () {
    pauseAutoPlay();
    scrollCarousel("prev");
    // Resume after delay
    setTimeout(function () {
      resumeAutoPlay();
    }, AUTO_PLAY_DELAY * 2);
  });

  activeNextButton.addEventListener("click", function () {
    pauseAutoPlay();
    scrollCarousel("next");
    // Resume after delay
    setTimeout(function () {
      resumeAutoPlay();
    }, AUTO_PLAY_DELAY * 2);
  });

  // Update buttons and dots on scroll (for manual scrolling or dot clicks)
  let scrollTimeout;
  let manualScrollTimeout;
  matchesCarousel.addEventListener("scroll", function () {
    updateButtons();

    // Pause auto-play on manual scroll
    if (!isProgrammaticScroll) {
      pauseAutoPlay();
      // Resume after user stops scrolling
      clearTimeout(manualScrollTimeout);
      manualScrollTimeout = setTimeout(function () {
        resumeAutoPlay();
      }, AUTO_PLAY_DELAY * 2);

      // Debounce the dot update to avoid conflicts during smooth scrolling
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        updateActiveDot();
      }, 100);
    }
  });

  // Initial update of active dot
  updateActiveDot();

  // Initial button state
  // Use setTimeout to ensure DOM is fully rendered
  setTimeout(function () {
    updateButtons();
  }, 100);

  // Handle window resize to recalculate carousel
  let resizeTimeout;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      // Recalculate dots based on new viewport width
      const totalMatches =
        matchesCarousel.querySelectorAll(".single-match").length;
      const matchesPerView = getItemsPerView();
      if (totalMatches > matchesPerView) {
        updateCarouselDots(totalMatches);
        // Update active dot based on current scroll position with new calculation
        updateActiveDot();
      }
      // Restart auto-play with new viewport settings
      startAutoPlay();
    }, 250);
  });

  // Pause auto-play on hover (if enabled)
  if (AUTO_PLAY_PAUSE_ON_HOVER) {
    const carouselContainer = document.querySelector(
      ".cancelled-matches-carousel .carousel-container"
    );
    if (carouselContainer) {
      carouselContainer.addEventListener("mouseenter", function () {
        pauseAutoPlay();
      });
      carouselContainer.addEventListener("mouseleave", function () {
        resumeAutoPlay();
      });
    }
  }

  // Pause auto-play when user manually scrolls
  matchesCarousel.addEventListener("touchstart", function () {
    pauseAutoPlay();
  });
  matchesCarousel.addEventListener("mousedown", function () {
    pauseAutoPlay();
  });

  // Resume auto-play after user stops interacting
  let interactionTimeout;
  matchesCarousel.addEventListener("touchend", function () {
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(function () {
      resumeAutoPlay();
    }, AUTO_PLAY_DELAY * 2);
  });
  matchesCarousel.addEventListener("mouseup", function () {
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(function () {
      resumeAutoPlay();
    }, AUTO_PLAY_DELAY * 2);
  });
}

// ---------- HELPER FUNCTIONS ---------- //

function formatDateOnly(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];

  return `${day} ${month}`;
}

function formatDateLabel(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName} ${day} ${month} ${year}`;
}

// ---------- HANDLE DUDACONTENTEDITOR SETTINGS ---------- //

function handleDudaContentEditorSettings() {
  // HIDE WIDGET TITLE if hide_widget_title is true or there are no matches
  if (hideWidgetTitle || !hasAnyMatches()) {
    const mainWidgetTitle = document.querySelector(
      ".cancelled-matches-carousel .main-widget-title"
    );
    if (mainWidgetTitle) mainWidgetTitle.style.display = "none";
  }
  // DARK MODE
  const cancelledMatchesCarousel = document.querySelector(
    ".cancelled-matches-carousel"
  );
  darkMode
    ? cancelledMatchesCarousel.classList.add("dark-mode")
    : cancelledMatchesCarousel.classList.remove("dark-mode");

  // Add editorBody class to Duda editor message wrap if in editor mode
  const dudaEditorMessageWrap = document.querySelector(
    ".cancelled-matches-carousel .duda-editor-message-wrap"
  );
  if (dudaEditorMessageWrap && data.inEditor) {
    dudaEditorMessageWrap.classList.add("editorBody");
  }
}

// ---------- LOADER FUNCTIONS ---------- //

function showLoader() {
  const loader = document.querySelector(".cancelled-matches-carousel-loader");
  const cancelledMatchesCarousel = document.querySelector(
    ".cancelled-matches-carousel"
  );

  if (loader) loader.style.display = "flex";
  if (cancelledMatchesCarousel) cancelledMatchesCarousel.style.display = "none";
}

function hideLoader() {
  const loader = document.querySelector(".cancelled-matches-carousel-loader");
  const cancelledMatchesCarousel = document.querySelector(
    ".cancelled-matches-carousel"
  );

  if (loader) loader.style.display = "none";
  if (cancelledMatchesCarousel)
    cancelledMatchesCarousel.style.display = "block";
}

// ---------- INITIALIZATION ---------- //

fetchCancelledMatches();
