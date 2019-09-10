/* eslint-disable require-jsdoc */
const BASEURL = 'http://redsox.uoa.auckland.ac.nz/ms/MuseumService.svc';


function refreshIfVisible() {
  // If any of the sections are visible, refresh using the relevant function
  const functionList = {
    'default': undefined,
    'displays': getItems,
    'news': getNews,
    'guestbook': getComments,
  };
  const observer = new IntersectionObserver((sections) => {
    sections.forEach((section) => {
      /* Check if the section is visible (intersecting),
       and then if it has a refresh function defined */
      if (section.isIntersecting && functionList[section.target.id]) {
        functionList[section.target.id]();
      };
    });
  });
  // Add the listner/observer to each of the sections
  for (section of Object.keys(functionList)) {
    observer.observe(document.querySelector(`section#${section}`));
  }
}

function createItemArticle({Description, ItemId, Title}) {
  const article = document.createElement('article');

  article.innerHTML = `<header><h3>${Title}</h3></header>
    <div class="article-content">
    <a href="${BASEURL}/itemimg?id=${ItemId}">
      <img src="${BASEURL}/itemimg?id=${ItemId}">
    </a>
    ${Description}
    </div>`;

  return article;
}

async function getItems(searchTerm) {
  // Search if we're passed a search term, else fetch all items
  const url = searchTerm === undefined ? `items` : `search?term=${searchTerm}`;

  const response = await fetch(`${BASEURL}/${url}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      });
  const items = await response.json();

  const baseDiv = document.querySelector('div#items');
  baseDiv.innerHTML = ''; // Clear any existing items, if existing
  items.forEach((i) => {
    baseDiv.append(createItemArticle(i));
  });
}

function getComments() {
  const iframe = document.querySelector('iframe');
  /* Hack to get around the fact that cross-origin scripting
  prevents us from actually reloading an iframe. Becuase of course,
  providing an html endpoint and requiring the use of an iFrame with it
  has no issues whatsoever.*/
  iframe.src = iframe.src;
}

async function postComment(name, content) {
  const response = await fetch(`${BASEURL}/comment?name=${name}`,
      {
        headers: {
        // Seems to complain if we don't send charset as well
          'Content-Type': 'application/json; charset=utf-8',
        },
        method: 'POST',
    body: JSON.stringify(comment.value)
      // Newlines break the server. Probably other stuff as well.
      });

  if (response.status === 200) {
    return true;
  } else {
    alert(`Could not send comment: ${response.status} - ${response.statusText}`);
    return false;
  }
}

function createNewsArticle({descriptionField, enclosureField, linkField, pubDateField, titleField}) {
  const article = document.createElement('article');
  article.innerHTML = `<header>
    <a href="${linkField}"><h3>${titleField}</h3></a>
    <span class="date">${pubDateField}</span>
    </header>
    <div class="article-content">
    <a href="${enclosureField.urlField}">
      <img src="${enclosureField.urlField}">
    </a>
    ${descriptionField}
    </div>`;

  return article;
}

async function getNews() {
  const response = await fetch(`${BASEURL}/news`,
      {headers: {'Accept': 'application/json'}});
  const news = await response.json();

  const baseDiv = document.querySelector('div#news-items');
  baseDiv.innerHTML = '';
  news.forEach((n) => {
    baseDiv.append(createNewsArticle(n));
  });
}

async function checkAPIVersion() {
  const EXPECTED = '1.0.1';


  const response = await fetch(`${BASEURL}/version`,
      {headers: {'Accept': 'application/json'}});
  const actual = await response.json();

  if (EXPECTED !== actual) {
    console.error(`Expected API version ${EXPECTED}; but got version ${actual} instead`);
  }
}

async function setLogo() {
  const response = await fetch(`http://redsox.uoa.auckland.ac.nz/ms/logo.svg`);
  const svg = await response.text();
  document.querySelector('#logo-link>svg').outerHTML = svg;
}

window.onload = () => {
  // Log an error if the API is not the expected version
  checkAPIVersion();

  // Inline the SVG logo (so we can colour it)
  setLogo();

  // Redirect to the homepage if we have no hash
  if (!window.location.hash) {
    window.location.hash = 'default';
  }

  // Add an event listener to search as the user types in the searchbox
  const searchBox = document.querySelector('#search-box');
  searchBox.addEventListener('input', () => {
    getItems(searchBox.value);
  });

  document.querySelector('section>form')
      .addEventListener('submit', async () => {
        const name = document.querySelector('input#name');
        const comment = document.querySelector('textarea#comment');
        const resp = await postComment(name.value, comment.value);
        /* firefox doesn't like if we just inline the await postCommment(...)
into the if statement, because reasons?(?)*/
        if (resp) {
          name.value = '';
          comment.value = '';
          getComments();
        }
      });

  refreshIfVisible();
};
