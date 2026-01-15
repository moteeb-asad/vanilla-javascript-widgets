import { data, api } from "./dummyData.js";

// Global Variable Declaration
var MatSchList;
var ActiveCollection = [];
var cache = {};
var OriginalMatchesList = []; // Store the original list before applying filters
var FiltersApplied = false; // Track if filters were applied
var savedMatchTemplate = null; // Store the template globally

// Get Collection
api.collections
  .getCollection({ collectionName: data.collections[0] })
  .then(function (collectionData) {
    MatSchList = collectionData;
    LoadDates(collectionData);
  })
  .catch(function (error) {
    console.error("Error loading initial collection:", error);
  });

async function prerequestCollection(collection, date, isDateChange) {
  // Wait for new data
  const data = await requestCollection(collection);
  if (!isDateChange) {
    LoadMatchFilters();
  }
}

function requestCollection(collection) {
  if (!cache[collection]) {
    return api.collections
      .getCollection({ collectionName: collection })
      .then(function (data) {
        var matches = data.map((item) => item.data);
        cache[collection] = matches;
        ActiveCollection = cache[collection];
        return cache[collection];
      })
      .catch(function (error) {
        console.error("Error in requestCollection:", error);
        return [];
      });
  }
  ActiveCollection = cache[collection];
  return Promise.resolve(cache[collection]);
}

// To Expand Accordion OnClick | To Change Tabs

document.addEventListener("click", function (e) {
  if (!e.target.closest(".list-group .accordion-panel")) return;
  e.preventDefault();

  const accordionPanel = e.target.closest(".accordion-panel");
  const panelIndex = accordionPanel.getAttribute("data-accordion-id");
  const targetAccordion = document.querySelector(
    `.accordion-content[data-accordion-content-id="${panelIndex}"]`
  );
  const singleItem = accordionPanel.closest(".single-item");

  if (!targetAccordion || !singleItem) return;

  // Ensure we are checking inside the current accordion
  const navOne = singleItem.querySelector(".nav-pills .nav-link.one");
  if (navOne) {
    navOne.click();
  }

  // Toggle accordion visibility
  document.querySelectorAll(".accordion-content").forEach((content) => {
    if (content !== targetAccordion) {
      content.classList.remove("show");
      const panel = content.parentElement.querySelector(".accordion-panel");
      if (panel) panel.classList.add("collapsed");
    }
  });

  targetAccordion.classList.toggle("show");
  accordionPanel.classList.toggle(
    "collapsed",
    !targetAccordion.classList.contains("show")
  );
});

$(document).on("click", ".nav-pills .nav-link", function (e) {
  e.preventDefault();

  // Remove "active" class from all links and tab panes
  $(".nav-pills .nav-link").removeClass("active");
  $(".nav-pills-content .tab-pane").removeClass("active");

  // Add "active" class to the clicked tab
  $(this).addClass("active");

  // Get the corresponding tab content ID based on the link's ID
  const tabId = $(this).attr("id").replace("pills-tab-", "pills-content-");

  // Activate the corresponding tab content
  $("#" + tabId).addClass("active");
});

// Load filters based on custom select change
$(".custom-select").change(async function () {
  let isDateChange = $(this).hasClass("date-selector"); // Check if it's the date selector

  if (isDateChange) {
    var collection = $(this).find("option:selected").data("collection");
    var date = $(this).val();
    // Wait for collection to load before calling LoadMatchFilters
    await prerequestCollection(collection, date, isDateChange);
  }

  // Now call LoadMatchFilters after data is available
  LoadMatchFilters(isDateChange);
});

// Toggle Filter button to show checboxes box
$(".team-filters .dropdown-toggle").click(function () {
  $(".team-filters .dropdown-menu").toggleClass("show");
});

// Event listener for filters Apply button click
$(document).on("click", ".apply-filters-btn", function (e) {
  e.preventDefault();

  // Mark filters as applied
  FiltersApplied = true;
  LoadMatchFilters();

  // close the filter box
  $(".team-filters .dropdown-menu").removeClass("show");
});

// Event listener for Reset Filters button click
$(document).on("click", ".reset-btn-link", function (e) {
  e.preventDefault();
  ResetFilters();
});

//  -------------- Dates Dropdown Related Functions --------------

var DateSelector = $(".date-selector");

function GetMonthName(dateString) {
  const monthNames = [
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

  // Ensure the date is properly parsed
  const d = new Date(dateString);

  // Check if the date is valid
  if (isNaN(d.getTime())) {
    console.error("Invalid date:", dateString);
    return "Unknown"; // Prevents "undefined"
  }

  return monthNames[d.getUTCMonth()]; // Use `getUTCMonth()` for ISO format
}

function GetDayName(dateString) {
  var days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  var d = new Date(dateString);
  var dayName = days[d.getDay()];
  return dayName;
}

function getSortedUniqueMatchDates() {
  let uniqueDates = new Set();
  let MatchDateArray = [];

  MatSchList.forEach((item) => {
    if (!uniqueDates.has(item.data.date)) {
      uniqueDates.add(item.data.date);
      MatchDateArray.push({
        date: item.data.date,
        title: item.data.title,
        collectionname: item.data.collectionname,
      });
    }
  });

  // Sort dates in ascending order
  MatchDateArray.sort((a, b) => new Date(a.date) - new Date(b.date));

  return MatchDateArray;
}

function renderDateDropdown(MatchDateArray) {
  let MonthArray = new Set();
  let DatesHTMLString = "";

  DateSelector.empty();

  MatchDateArray.forEach((match, index) => {
    let monthName = GetMonthName(match.date);

    // If it's a new month, close the previous group and start a new one
    if (!MonthArray.has(monthName)) {
      MonthArray.add(monthName);
      if (index !== 0) DatesHTMLString += `</optgroup>`;
      DatesHTMLString += `<optgroup label="${monthName}">`;
    }

    // Add the date option
    if (match.date) {
      DatesHTMLString += `<option value="${match.date}" data-collection="${
        match.collectionname
      }">
                ${GetDayName(match.date)} ${match.title}
            </option>`;
    }
  });

  DatesHTMLString += `</optgroup>`; // Close the last group
  DateSelector.html(DatesHTMLString);

  // Preload first collection
  if (MatchDateArray.length > 0) {
    prerequestCollection(
      MatchDateArray[0].collectionname,
      MatchDateArray[0].date
    );
  }
}

function LoadDates() {
  let MatchDateArray = getSortedUniqueMatchDates();
  renderDateDropdown(MatchDateArray);
}

//  -------------- Filters Related Functions --------------

function formatDateToDDMMYYYY(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function LoadMatchFilters(isDateChange = false) {
  var FinalMatchesList = ActiveCollection;
  var SelectedDateString = $(".date-selector").val();
  var SelectedSortOption = parseInt($(".sort-selector").val(), 10); // Convert to number

  let formattedSelectedDate = formatDateToDDMMYYYY(SelectedDateString);
  var grouped = groupBy(FinalMatchesList, (match) => match.date.toString());

  // Get the filtered list for the selected date
  FinalMatchesList = grouped.get(formattedSelectedDate) || [];

  // Save original list only if filters are applied AND it's NOT a date change
  if (!isDateChange && FiltersApplied && OriginalMatchesList.length === 0) {
    OriginalMatchesList = [...FinalMatchesList];
  }

  // If date is changed or widget is loaded first time, update the checkboxes
  if (isDateChange || OriginalMatchesList.length === 0) {
    LoadCategoryCheckboxes(FinalMatchesList);
    LoadGenderTeamCheckboxes(FinalMatchesList);
  }

  // Get selected filter values
  var selectedCategories = getCheckedValues(
    ".category-checkboxes input:checked"
  );
  var selectedGenders = getCheckedValues(
    ".gender-team-checkboxes input:checked"
  );
  var selectedLocations = getCheckedValues(
    ".location-checkboxes input:checked"
  );

  // Filter matches based on selected values
  FinalMatchesList = filterMatches(
    FinalMatchesList,
    selectedCategories,
    selectedGenders,
    selectedLocations
  );

  // Sort Data based on dropdown value
  FinalMatchesList = sortFilter(FinalMatchesList, SelectedSortOption);

  // Load final matches in schedule
  LoadMatchesSchedule(FinalMatchesList);
}

function sortFilter(FinalMatchesList, SelectedSortOption) {
  if (![1, 2, 3, 4].includes(SelectedSortOption)) {
    return FinalMatchesList; // Return original list if sorting option is invalid
  }

  return FinalMatchesList.slice().sort((a, b) => {
    if (SelectedSortOption === 1 || SelectedSortOption === 2) {
      let aDateTime = new Date(
        `${a.date.split("-").reverse().join("-")}T${a.time || "00:00"}`
      );
      let bDateTime = new Date(
        `${b.date.split("-").reverse().join("-")}T${b.time || "00:00"}`
      );

      return SelectedSortOption === 1
        ? aDateTime - bDateTime
        : bDateTime - aDateTime;
    }

    if (SelectedSortOption === 3) {
      return b.min_age - a.min_age; // Sort by min_age descending
    }

    if (SelectedSortOption === 4) {
      return b.max_age - a.max_age; // Sort by max_age descending
    }

    return 0;
  });
}

function LoadCategoryCheckboxes(result) {
  var categoryContainer = $(".category-checkboxes");

  // Save currently selected values before clearing
  var selectedValues = getCheckedValues(".category-checkboxes input:checked");

  // Clear existing checkboxes but keep the heading
  categoryContainer.find(".custom-control").remove();

  var uniqueCategories = new Set();

  // Extract unique categories
  result.forEach(function (item) {
    if (item.category) {
      // Normalize the category string by removing spaces and converting to lowercase for comparison
      const normalizedCategory = item.category
        .toLowerCase()
        .replace(/\s+/g, "");

      // Check if we already have this category (case-insensitive)
      const isDuplicate = [...uniqueCategories].some(
        (existingCategory) =>
          existingCategory.toLowerCase().replace(/\s+/g, "") ===
          normalizedCategory
      );

      if (!isDuplicate) {
        uniqueCategories.add(item.category);
      }
    }
  });

  if (uniqueCategories.size === 0) {
    categoryContainer.hide(); // Hide the container if no categories exist
    return;
  } else {
    categoryContainer.show(); // Show the container if categories exist
  }

  // Append checkboxes dynamically
  [...uniqueCategories].forEach((category, index) => {
    var checkboxId = `category-checkbox-${index + 1}`;

    var checkboxElement = document.createElement("div");
    checkboxElement.classList.add("custom-control", "custom-checkbox");

    var inputElement = document.createElement("input");
    inputElement.type = "checkbox";
    inputElement.classList.add("custom-control-input", "category-filter");
    inputElement.id = checkboxId;
    inputElement.value = category;

    // Check if this value was previously selected
    if (selectedValues.includes(category)) {
      inputElement.checked = true;
    }

    var labelElement = document.createElement("label");
    labelElement.classList.add("custom-control-label");
    labelElement.setAttribute("for", checkboxId);
    labelElement.textContent = category;

    checkboxElement.appendChild(inputElement);
    checkboxElement.appendChild(labelElement);
    categoryContainer.append(checkboxElement);
  });
}

function LoadGenderTeamCheckboxes(result) {
  var genderTeamContainer = $(".gender-team-checkboxes");

  // Save currently selected values before clearing
  var selectedValues = getCheckedValues(
    ".gender-team-checkboxes input:checked"
  );

  // Clear existing checkboxes but keep the heading
  genderTeamContainer.find(".custom-control").remove();

  var uniqueGenderTeams = new Set();

  // Extract unique categories
  result.forEach(function (item) {
    if (item.gender) {
      uniqueGenderTeams.add(item.gender);
    }
  });

  if (uniqueGenderTeams.size === 0) {
    genderTeamContainer.hide(); // Hide the container if no categories exist
    return;
  } else {
    genderTeamContainer.show(); // Show the container if categories exist
  }

  // Append checkboxes dynamically
  [...uniqueGenderTeams].forEach((genderteam, index) => {
    var checkboxId = `gender-team-checkbox-${index + 1}`;

    var checkboxElement = document.createElement("div");
    checkboxElement.classList.add("custom-control", "custom-checkbox");

    var inputElement = document.createElement("input");
    inputElement.type = "checkbox";
    inputElement.classList.add("custom-control-input", "gender-team-filter");
    inputElement.id = checkboxId;
    inputElement.value = genderteam;

    // Check if this value was previously selected
    if (selectedValues.includes(genderteam)) {
      inputElement.checked = true;
    }

    var labelElement = document.createElement("label");
    labelElement.classList.add("custom-control-label");
    labelElement.setAttribute("for", checkboxId);
    if (genderteam === "female") {
      labelElement.textContent = "Female";
    } else if (genderteam === "male") {
      labelElement.textContent = "Male";
    } else {
      labelElement.textContent = genderteam;
    }

    checkboxElement.appendChild(inputElement);
    checkboxElement.appendChild(labelElement);
    genderTeamContainer.append(checkboxElement);
  });
}

function getCheckedValues(selector) {
  return $(selector)
    .map(function () {
      return $(this).val();
    })
    .get();
}

function filterMatches(matches, categories, genders, locations) {
  const now = new Date();
  const currentTime =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0");

  return matches.filter((match) => {
    // Always show matches for the entire day regardless of start time
    var categoryMatch =
      categories.length === 0 || categories.includes(match.category);
    var genderMatch = genders.length === 0 || genders.includes(match.gender);
    var locationMatch =
      locations.length === 0 ||
      (locations.includes("Home") && match.is_home_match) ||
      (locations.includes("Away") && !match.is_home_match);

    // Check if match has started based on current time and match time
    if (match.time && match.time <= currentTime) {
      match.is_started = true;
    }

    // Don't filter out any matches - keep them visible for the whole day

    return categoryMatch && genderMatch && locationMatch;
  });
}

/*** Function to reset filters and restore original matches ***/

function ResetFilters() {
  if (OriginalMatchesList.length > 0) {
    LoadMatchesSchedule(OriginalMatchesList);
    LoadCategoryCheckboxes(OriginalMatchesList);
    LoadGenderTeamCheckboxes(OriginalMatchesList);

    // Clear selected checkboxes
    $(
      ".category-checkboxes input, .gender-team-checkboxes input, .location-checkboxes input"
    ).prop("checked", false);

    // Reset tracking variables
    FiltersApplied = false;
    OriginalMatchesList = [];
  }
  $(".team-filters .dropdown-menu").removeClass("show");
}

//  -------------- Load Matches Related Functions --------------

const getValidText = (value, fallback = "-") => (value ? value : fallback);

function LoadMatchesSchedule(scheduledmatches) {
  const customTableContainer = $(".custom-table");
  const upcomingMatchesLoader = $(".upcoming-matches-loader");
  const matchesContainer = $(".matches-container");

  upcomingMatchesLoader.hide();
  customTableContainer.show();

  // Get and save template if we haven't already
  if (!savedMatchTemplate) {
    const templateElement = matchesContainer.find(".single-item").first();
    if (templateElement.length) {
      savedMatchTemplate = templateElement.clone();
      // Hide original template
      templateElement.hide();
    } else {
      console.error("Match template not found in HTML");
      return;
    }
  }

  if (scheduledmatches.length === 0) {
    matchesContainer.html("<p class='text-center'>No matches available</p>");
    // Add back the hidden template
    matchesContainer.append(savedMatchTemplate.clone().hide());
    return;
  }

  const dummyLogoUrl = "https://dummyimage.com/265x265/f6f7f8/000000&text=Logo";
  const matchTemplate = savedMatchTemplate.clone();

  // Reset accordion state
  matchTemplate.find(".accordion-panel").addClass("collapsed");
  matchTemplate.find(".accordion-content").removeClass("show");

  matchesContainer.html(""); // Clear previous matches

  scheduledmatches.forEach((match, index) => {
    const newMatch = matchTemplate.clone();
    // Ensure accordion content does not retain the 'show' class after cloning
    newMatch.find(".accordion-content").removeClass("show");

    newMatch.find(".accordion-panel").attr("data-accordion-id", index);
    newMatch
      .find(".accordion-content")
      .attr("data-accordion-content-id", index);

    newMatch
      .find(".nav-pills .nav-link.one")
      .attr("id", `accordion-${index}-pills-tab-1`);
    newMatch
      .find(".nav-pills .nav-link.two")
      .attr("id", `accordion-${index}-pills-tab-2`);
    newMatch
      .find(".nav-pills-content .tab-pane.one")
      .attr("id", `accordion-${index}-pills-content-1`);
    newMatch
      .find(".nav-pills-content .tab-pane.two")
      .attr("id", `accordion-${index}-pills-content-2`);

    //newMatch.find(".gender").text(getValidText(match.gender));
    newMatch
      .find(".home-team-img")
      .attr("src", getValidText(match.home_team_club_logo_url, dummyLogoUrl));

    // if is_home_match, show the home team name otherwise add club name
    if (match.is_home_match) {
      newMatch.find(".home-team").text(getValidText(match.home_team_name));
    } else {
      newMatch
        .find(".home-team")
        .text(
          getValidText(match.home_team_club_name) +
            " " +
            getValidText(match.home_team_name)
        );
    }

    newMatch
      .find(".away-team-img")
      .attr("src", getValidText(match.away_team_club_logo_url, dummyLogoUrl));

    // if is_home_match, add club name to the away team name otherwise show the away team name
    if (match.is_home_match) {
      newMatch
        .find(".away-team")
        .text(
          getValidText(match.away_team_club_name) +
            " " +
            getValidText(match.away_team_name)
        );
    } else {
      newMatch.find(".away-team").text(getValidText(match.away_team_name));
    }

    if (!match.time && !match.field) {
      newMatch.find(".main-time").text("n.n.b");
    } else {
      newMatch.find(".main-time").text(match.time || "");
      newMatch.find(".play-field").text(match.field || "");
    }

    newMatch
      .find(".badge.badge-warning")
      .text(match.is_cancelled ? "Cancelled" : "")
      .toggle(match.is_cancelled);
    newMatch.find(".infoicon-svg").toggle(!match.is_cancelled);

    newMatch
      .find(".home-team-club-logo")
      .attr("src", getValidText(match.home_team_club_logo_url, dummyLogoUrl));
    newMatch
      .find(".home-team-club-name")
      .text(getValidText(match.home_team_club_name));

    // Address
    newMatch
      .find(".home-team-address .street")
      .text(getValidText(match.location?.address?.street));
    newMatch
      .find(".home-team-address .house-number")
      .text(getValidText(match.location?.address?.house_number));
    newMatch
      .find(".home-team-address .zipcode")
      .text(getValidText(match.location?.address?.zip_code));
    newMatch
      .find(".home-team-address .city")
      .text(getValidText(match.location?.address?.city));

    // Contact
    const phone = match.location?.phones?.toString() || "";
    const email = match.location?.emails?.toString() || "";
    const webPage = match.location?.web_pages?.toString() || "";

    newMatch.find(".home-team-contact .phone").text(phone);
    newMatch.find(".home-team-contact .email").text(email);
    newMatch.find(".home-team-contact .web-page").text(webPage);

    // Hide .home-team-contact if all fields are empty
    if (!phone && !email && !webPage) {
      newMatch.find(".home-team-contact").hide();
    }

    // Map Direction
    let lat = match.location?.address?.geo?.latitude;
    let lng = match.location?.address?.geo?.longitude;
    let mapDirection = newMatch.find(".map-direction");

    if (!lat || !lng) {
      mapDirection.hide(); // Hide if lat/lng are empty
    } else {
      mapDirection
        .find("a")
        .attr("href", `https://www.google.com/maps/?q=${lat},${lng}`);
    }

    // Competition Information
    newMatch
      .find(".competition-information .opponent")
      .text(getValidText(match.away_team_name));
    newMatch
      .find(".competition-information .arrival-time")
      .text(getValidText(match.arrival_time));
    newMatch
      .find(".competition-information .play-time")
      .text(getValidText(match.time));
    newMatch
      .find(".competition-information .field")
      .text(getValidText(match.field));
    newMatch
      .find(".competition-information .competition-number")
      .text(getValidText(match.code));
    newMatch
      .find(".competition-information .club-note")
      .text(getValidText(match.club_remarks));
    newMatch
      .find(".competition-information .additional-note")
      .text(getValidText(match.extra_remarks));
    newMatch
      .find(".competition-information .referees")
      .text(getValidText(match.referees));

    // Standings Table
    const standingsTableBody = newMatch.find(".table-score tbody");
    const templateRow = standingsTableBody.find(".template-row"); // Get the template row

    standingsTableBody.find("tr:not(.template-row)").remove(); // Clear previous rows except the template

    if (Array.isArray(match.standings) && match.standings.length > 0) {
      match.standings.forEach((standing, i) => {
        const row = templateRow.clone(); // Clone template row
        row.removeClass("template-row").show(); // Remove template class and make visible

        row.find(".position").text(i + 1);
        row
          .find(".club-logo")
          .attr("src", getValidText(standing.club_logo, dummyLogoUrl));
        row.find(".club-name").text(getValidText(standing.club_name));
        row.find(".games-played").text(getValidText(standing.played, 0));
        row.find(".game-points").text(getValidText(standing.points, 0));

        standingsTableBody.append(row);
      });
    } else {
      standingsTableBody.append(
        `<tr><td colspan="5" class="text-center">No standings available</td></tr>`
      );
    }

    matchesContainer.append(newMatch);

    // Remove Referee based on toggle condition
    if (data.config.showRef == true) {
      $(".referee-row").remove();
    }
  });
}

function groupBy(list, keyGetter) {
  const map = new Map();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}
