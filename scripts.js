import { createBookElement, createOptionElement } from "./utils/helper.js";
// Importing utility functions `createBookElement` and `createOptionElement` from the helper module.

import { books, authors, genres, BOOKS_PER_PAGE } from "./data.js";
// Importing data arrays `books`, `authors`, `genres`, and a constant `BOOKS_PER_PAGE` from the data module.

let page = 1;
let matches = books;
// Initializing the current page number to 1 and setting the matches to the entire books array.

function initialize() {
  createBookList();
  createOptionLists();
  checkAndSetTheme();
  updateShowMoreButton();
}
// Main initialization function that calls other functions to set up the initial state of the application.

function createBookList() {
  const starting = document.createDocumentFragment();
  const initialBooks = matches
    .slice(0, BOOKS_PER_PAGE)
    .map(({ author, id, image, title }) =>
      createBookElement({ author, id, image, title })
    );
  appendElements(starting, "[data-list-items]", initialBooks);
}
// Creates the initial book list using a document fragment for efficient DOM manipulation.
// It slices the matches array to get the first page of books and maps each book to a book element.

function createOptionLists() {
  const genreHtml = createOptionElement(genres, "All Genres");
  const authorHtml = createOptionElement(authors, "All Authors");
  appendElements(genreHtml, "[data-search-genres]");
  appendElements(authorHtml, "[data-search-authors]");
}
// Creates the option lists for genres and authors and appends them to the corresponding elements in the DOM.

function appendElements(fragment, selector, elements = []) {
  elements.forEach((element) => fragment.appendChild(element));
  document.querySelector(selector).appendChild(fragment);
}
// A utility function to append a list of elements to a specified DOM element identified by the selector.

function setThemeColors(theme) {
  const colors = {
    darkColor: theme === "night" ? "255, 255, 255" : "10, 10, 20",
    lightColor: theme === "night" ? "10, 10, 20" : "255, 255, 255",
  };
  const { darkColor, lightColor } = colors;
  document.querySelector("[data-settings-theme]").value = theme;
  document.documentElement.style.setProperty("--color-dark", darkColor);
  document.documentElement.style.setProperty("--color-light", lightColor);
}
// Sets the theme colors based on the provided theme (either "night" or "day") by updating CSS custom properties.

function checkAndSetTheme() {
  const theme =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "night"
      : "day";
  setThemeColors(theme);
}
// Checks the user's preferred color scheme and sets the theme colors accordingly.

function updateShowMoreButton() {
  const remainingBooks = Math.max(books.length - BOOKS_PER_PAGE, 0);
  const listButton = document.querySelector("[data-list-button]");
  listButton.innerText = `Show more (${remainingBooks})`;
}
// Updates the "Show more" button text to indicate the number of remaining books and disables the button if necessary.

function setupEventListeners() {
  document
    .querySelector("[data-search-cancel]")
    .addEventListener("click", () => {
      document.querySelector("[data-search-overlay]").open = false;
    });

  document
    .querySelector("[data-settings-cancel]")
    .addEventListener("click", () => {
      document.querySelector("[data-settings-overlay]").open = false;
    });

  document
    .querySelector("[data-header-search]")
    .addEventListener("click", () => {
      document.querySelector("[data-search-overlay]").open = true;
      document.querySelector("[data-search-title]").focus();
    });

  document
    .querySelector("[data-header-settings]")
    .addEventListener("click", () => {
      document.querySelector("[data-settings-overlay]").open = true;
    });

  document.querySelector("[data-list-close]").addEventListener("click", () => {
    document.querySelector("[data-list-active]").open = false;
  });

  document
    .querySelector("[data-settings-form]")
    .addEventListener("submit", handleSettingsFormSubmit);

  document
    .querySelector("[data-search-form]")
    .addEventListener("submit", handleSearchFormSubmit);

  document
    .querySelector("[data-list-button]")
    .addEventListener("click", handleShowMoreButtonClick);

  document
    .querySelector("[data-list-items]")
    .addEventListener("click", handleListItemClick);
}
// Sets up various event listeners for handling user interactions with the search and settings overlays,
// list item clicks, and form submissions.

function handleSettingsFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const { theme } = Object.fromEntries(formData);

  setThemeColors(theme);

  document.querySelector("[data-settings-overlay]").open = false;
}
// Handles the settings form submission to update the theme colors based on the selected theme.

function handleSearchFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const filters = Object.fromEntries(formData);
  const result = applyFilters(filters);

  updateBookList(result);
}
// Handles the search form submission to filter books based on the provided search criteria and updates the book list.

function handleShowMoreButtonClick() {
  const fragment = document.createDocumentFragment();
  const start = page * BOOKS_PER_PAGE;
  const end = (page + 1) * BOOKS_PER_PAGE;
  const additionalBooks = matches
    .slice(start, end)
    .map(({ author, id, image, title }) =>
      createBookElement({ author, id, image, title })
    );

  appendElements(fragment, "[data-list-items]", additionalBooks);
  page += 1;
}
// Handles the "Show more" button click to load and display more books.
// It calculates the start and end indices for the next set of books and appends them to the list.

function handleListItemClick(event) {
  const pathArray = Array.from(event.path || event.composedPath());
  let active = null;

  for (const node of pathArray) {
    if (active) break;

    if (node?.dataset?.preview) {
      active = findActiveBook(node.dataset.preview);
    }
  }

  if (active) {
    showActiveBook(active);
  }
}
// Handles clicks on the book list items. It identifies the clicked book by traversing the event path and displays its details.

function applyFilters(filters) {
  return books.filter((book) => {
    let genreMatch = filters.genre === "any";

    for (const singleGenre of book.genres) {
      if (genreMatch) break;
      if (singleGenre === filters.genre) {
        genreMatch = true;
      }
    }

    return (
      (filters.title.trim() === "" ||
        book.title.toLowerCase().includes(filters.title.toLowerCase())) &&
      (filters.author === "any" || book.author === filters.author) &&
      genreMatch
    );
  });
}
// Filters the books based on the provided filters for title, author, and genre.

function updateBookList(result) {
  page = 1;
  matches = result;

  const listMessage = document.querySelector("[data-list-message]");
  listMessage.classList.toggle("list__message_show", result.length < 1);

  document.querySelector("[data-list-items]").innerHTML = "";
  createBookList();

  updateShowMoreButton();

  window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelector("[data-search-overlay]").open = false;
}
// Updates the book list with the filtered results. It resets the page number, updates the matches,
// and recreates the book list. It also handles the display of a message if no results are found.

function findActiveBook(id) {
  return books.find((book) => book.id === id);
}
// Finds and returns the active book based on its ID.

function showActiveBook(active) {
  document.querySelector("[data-list-active]").open = true;
  document.querySelector("[data-list-blur]").src = active.image;
  document.querySelector("[data-list-image]").src = active.image;
  document.querySelector("[data-list-title]").innerText = active.title;
  document.querySelector("[data-list-subtitle]").innerText = `${
    authors[active.author]
  } (${new Date(active.published).getFullYear()})`;
  document.querySelector("[data-list-description]").innerText =
    active.description;
}
// Displays the details of the active book in the overlay by updating the corresponding DOM elements with the book's information.

initialize();
setupEventListeners();
// Calls the initialization function and sets up event listeners when the script is loaded.
