/* eslint-disable require-jsdoc */
const BASE_URL = 'http://localhost:8188/MuseumService.svc';
const BASE_URL_SECURE = 'http://localhost:8189/Service.svc';

const MESSAGE_TYPE = {
  ERROR: { text: 'Error: ', className: 'message-error' },
  WARNING: { text: 'Warning: ', className: 'message-warning' },
  INFO: { text: '', className: 'message-info' }
}

let credentials; //🙃

function refreshIfVisible() {
  // If any of the sections are visible, refresh using the relevant function
  const functionList = {
    'default': undefined,
    'displays': getItems,
    'news': getNews,
    'shop': getShop,
    'guestbook': getComments,
    'login-register': updateLoggedElements
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

function createItemArticle({ Description, ItemId, Title }) {
  const article = document.createElement('article');

  article.innerHTML = `<header><h3>${Title}</h3></header>
    <div class="article-content">
    <a href="${BASE_URL}/itemimg?id=${ItemId}">
      <img src="${BASE_URL}/itemimg?id=${ItemId}">
    </a>
    ${Description}
    </div>`;

  return article;
}

async function getItems(searchTerm) {
  // Search if we're passed a search term, else fetch all items
  const url = searchTerm === undefined ? `items` : `search?term=${searchTerm}`;

  const response = await fetch(`${BASE_URL}/${url}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    });
  const items = await response.json();

  const baseDiv = document.querySelector('div#display-items');
  baseDiv.innerHTML = ''; // Clear any existing items, if existing
  items.forEach((i) => {
    baseDiv.append(createItemArticle(i));
  });
}

function buyShopItem(event) {
  if (!event.target.classList.contains('buy')) {
    //exit if we didn't click on a buy me button
    return;
  }
  secureRequest(`buy?id=${event.target.dataset.id}`, (e) => {
    const xhr = e.target;
    alert(JSON.parse(xhr.response))
  })
}

function createShopItem({ Description, ItemId, Title }) {
  const article = document.createElement('article');

  article.innerHTML = `<header><h3>${Title}</h3></header>
    <div class="article-content">
    <a href="${BASE_URL}/shopimg?id=${ItemId}">
      <img src="${BASE_URL}/shopimg?id=${ItemId}">
    </a>
    <div class="shop-inner">
      ${Description}
      <button type="button" class="buy" data-id=${ItemId}>🛒 Buy me!</button>
    </div
    </div>`;

  return article;
}

async function getShop(searchTerm) {
  // Search if we're passed a search term, else fetch all items;

  const response = await fetch(`${BASE_URL}/shop?term=${searchTerm ? searchTerm : ""}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    });
  const items = await response.json();

  const baseDiv = document.querySelector('div#shop-items');
  baseDiv.innerHTML = ''; // Clear any existing items, if existing
  items.forEach((i) => {
    baseDiv.append(createShopItem(i));
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

async function postComment() {
  const name = document.querySelector('input#name');
  const comment = document.querySelector('textarea#comment');

  const response = await fetch(`${BASE_URL}/comment?name=${name.value}`, {
    headers: {
      // Seems to complain if we don't send charset as well
      'Content-Type': 'application/json; charset=utf-8',
    },
    method: 'POST',
    body: JSON.stringify(comment.value)
    // Newlines break the server. Probably other stuff as well.
  });

  if (response.status === 200) {
    name.value = '';
    comment.value = '';
    getComments();
    return true;
  } else {
    alert(`Could not send comment: ${response.status} - ${response.statusText}`);
    return false;
  }
}

function createNewsArticle({ descriptionField, enclosureField, linkField, pubDateField, titleField }) {
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
  const response = await fetch(`${BASE_URL}/news`,
    { headers: { 'Accept': 'application/json' } });
  const news = await response.json();

  const baseDiv = document.querySelector('div#news-items');
  baseDiv.innerHTML = '';
  news.forEach((n) => {
    baseDiv.append(createNewsArticle(n));
  });
}
function createMessage(container, description, type) {
  if (typeof container === "string") {
    //accept string or element itself
    container = document.querySelector(container)
  }

  let message = document.createElement('div');
  message.classList.add('message');
  message.classList.add(type.className);
  message.textContent = `${type.text}${description}`;

  container.innerHTML = ""
  container.append(message);
}

function updateLoggedElements() {
  //Updates the page if the user is logged in or logged out
  const logout = document.querySelector("div#logout");
  const loginRegister = document.querySelector("div#login-register-inner");
  const headerLink = document.querySelector("a[href='#login-register']");
  const logoutText = document.querySelector("span#template-user")

  if (credentials) {
    logout.style.display = 'block';
    loginRegister.style.display = 'none';
    headerLink.textContent = `🔒 ${credentials.username}`
    logoutText.textContent = credentials.username
  }
  else {
    logout.style.display = 'none';
    loginRegister.style.display = 'flex';
    headerLink.textContent = '🔒 Login/Register'
    logoutText.textContent = ''
  }
}

function secureRequest(endpoint, onload) {
  if (credentials === undefined) {
    window.location.hash = 'login-register';
    return
  }
  let xhr = new XMLHttpRequest();
  xhr.open("GET", `${BASE_URL_SECURE}/${endpoint}`, true, credentials.username, credentials.password);
  xhr.setRequestHeader('Accept', 'application/json')
  xhr.withCredentials = true
  xhr.onload = onload
  xhr.send()
}

function login(e, username, password) {
  //Prevents the page refreshing on form submit
  e.preventDefault();

  credentials = { username: username, password: password }

  secureRequest('id', (event) => {
    const xhr = event.target
    const messages = 'form#login div.messages';
    if (xhr.status == 401) {
      createMessage(messages, 'Incorrect username or password', MESSAGE_TYPE.ERROR)
      credentials = undefined;
    } else if (xhr.status == 200) {
      credentials = { username: username, password: password }
      // Obviously this looks weird here, but the user will only see it if they log out again
      createMessage(messages, 'Successfully logged out', MESSAGE_TYPE.INFO)
      updateLoggedElements()
    } else {
      console.log(xhr)
      createMessage(messages, "something unknown went really, really wrong", MESSAGE_TYPE.ERROR)
    }
  })
}

async function register(e) {
  //Prevents the page refreshing on form submit
  e.preventDefault();

  //I kinda wanna do this more elegantly, but whatever
  const name = document.querySelector('form#register input[name="username"]');
  const password = document.querySelector('form#register input[name="password"]');
  const confirm = document.querySelector('form#register input[name="confirm-password"]');
  const address = document.querySelector('form#register textarea[name="address"]');
  const messages = document.querySelector('form#register div.messages');

  messages.textContent = '';

  if (password.value !== confirm.value) {
    createMessage(messages, 'Passwords do not match', MESSAGE_TYPE.ERROR);
    return;
  }
  //Mainly just because it's fun to say
  const responseStringifiable = JSON.stringify({
    Address: address.textContent,
    Name: name.value,
    Password: password.value
  });

  const response = await fetch(`${BASE_URL}/register`, {
    headers: {
      // Seems to complain if we don't send charset as well
      'Content-Type': 'application/json; charset=utf-8',
    },
    method: 'POST',
    body: responseStringifiable
  });

  if (response.status === 200) {
    createMessage(messages, "Successfully registered", MESSAGE_TYPE.INFO);
    login(e, name.value, password.value);
  }
  else {
    console.log(response)
    createMessage(messages, await response.statusText, MESSAGE_TYPE.ERROR);
  }

}

async function checkAPIVersion(api) {

  const response = await fetch(`${api.url}/version`,
    { headers: { 'Accept': 'application/json' } });
  const actual = await response.json();

  if (api.expected !== actual) {
    console.error(`For ${api.name} API, expected version ${api.expected}; but got version ${actual} instead`);
  }

}

async function setLogo() {
  const response = await fetch(`http://redsox.uoa.auckland.ac.nz/ms/logo.svg`);
  const svg = await response.text();
  document.querySelector('#logo-link>svg').outerHTML = svg;
}

function registerEventHandlers() {
  //All the onclicks and input changes and stuff. Yucky and boilerplatey, but whatever

  //Add the event listener to the parent to take advantage of bubbling,
  // prevent preformance issues with potentially dozens of click listeners on each buy me button
  document.querySelector('#shop-items').addEventListener('click', buyShopItem)

  // Add an event listener to search as the user types in the searchbox
  const searchDisplays = document.querySelector('#search-displays');
  searchDisplays.addEventListener('input', () => {
    getItems(searchDisplays.value);
  });
  const searchShop = document.querySelector('#search-shop');
  searchShop.addEventListener('input', () => {
    getShop(searchShop.value);
  });

  //Post comment
  document.querySelector('form#comment-form').addEventListener('submit', postComment);
  //login user
  document.querySelector('form#login').addEventListener('submit', (e) => {
    //Passing here simplifies logging in for first time after registration
    const pass = document.querySelector('form#login input[name="password"]')
    login(e,
      document.querySelector('form#login input[name="username"]').value,
      pass.value
    )
    pass.value = ""
  });
  //Register user
  document.querySelector('form#register').addEventListener('submit', register);

  //logout user
  document.querySelector('#logout>button').addEventListener('click', () => {
    credentials = undefined
    updateLoggedElements()
  })
}

window.onload = () => {

  // Log an error if the API is not the expected version
  const toCheck = [
    { expected: '1.1.0', url: BASE_URL, name: 'General/Insecure' },
    //{ expected: '1.0.0', url: BASE_URL_SECURE, name: 'Shop/Secure' }
  ]
  toCheck.forEach(api => checkAPIVersion(api))

  // Inline the SVG logo (so we can colour it)
  setLogo();

  // Redirect to the homepage if we have no hash
  if (!window.location.hash) {
    window.location.hash = 'default';
  }
  registerEventHandlers();
  refreshIfVisible();
};
