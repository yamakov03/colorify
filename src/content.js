let selectedElem = null;
let isSelecting = false;
let idCounter = 0;
let elements = {};
let initialBgColor = '#000000';
let initialTextColor = '#fff';

function getQuerySelector(elem) {
  if (elem.id) {
    return '#' + elem.id;
  }
  if (elem === document.body) {
    return 'body';
  }
  let selector = elem.tagName.toLowerCase();
  const sibling = elem.parentNode.children;
  for (let i = 0; i < sibling.length; i++) {
    if (sibling[i] === elem) {
      selector += `:nth-child(${i + 1})`;
      break;
    }
  }
  return getQuerySelector(elem.parentNode) + ' > ' + selector;
}

function changeTextColor(elem, color) {
  elem.style.color = color;
  
  for (let i = 0; i < elem.children.length; i++) {
    changeTextColor(elem.children[i], color);
  }
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.command === 'start') {
    isSelecting = true;
  } else if (request.command === 'highlightElem') {
    const elem = document.querySelector(request.querySelector);
    elem.style.boxShadow = 'inset 0 0 0 2px red';
    elem.style.outline = '2px solid red';

  } else if (request.command === 'unhighlightElem') {
    const elem = document.querySelector(request.querySelector);
    elem.style.boxShadow = '';
    elem.style.outline = '';

  } else if (request.command === 'removeElement') {
    const elem = document.querySelector(elements[request.id].querySelector)
    elem.style.background = elements[request.id].originalColor;
    elem.style.boxShadow = '';
    elem.style.outline = '';
    changeTextColor(elem, elements[request.id].originalTextColor);
    delete elements[request.id];
    chrome.storage.sync.set({ elements });

  } else if (request.command === 'addByQuery') {
    const id = Date.now().toString();
    const elem = document.querySelector(request.querySelector);
    elements[id] = {
      id,
      originalColor: elem.style.backgroundColor,
      originalTextColor: elem.style.color,
      color: initialBgColor,
      textColor: initialTextColor,
      querySelector: request.querySelector,
      colorToggle: true,
      textColorToggle: true,
      site: window.location.href
    };
    chrome.storage.sync.set({ elements });
    elem.style.background = initialBgColor;
    elem.style.color = initialTextColor;

  } else if (request.command === 'changeColor') {
    elements[request.id].color = request.color;
    chrome.storage.sync.set({ elements });
    const elem = document.querySelector(elements[request.id].querySelector)
    if (elements[request.id].colorToggle) {
      elem.style.background = elements[request.id].color;
    }

  } else if (request.command === 'changeTextColor') {
    elements[request.id].textColor = request.textColor;
    chrome.storage.sync.set({ elements });
    const elem = document.querySelector(elements[request.id].querySelector);
    if (elements[request.id].textColorToggle) {
      changeTextColor(elem, elements[request.id].textColor);
    }

  } else if (request.command === 'changeColorToggle') {
    elements[request.id].colorToggle = request.colorToggle;
    const elem = document.querySelector(elements[request.id].querySelector);
    if (elements[request.id].colorToggle) {
      elem.style.background = elements[request.id].color;
    } else {
      elem.style.background = elements[request.id].originalColor;
    }
    chrome.storage.sync.set({ elements });

  } else if (request.command === 'changeTextColorToggle') {
    elements[request.id].textColorToggle = request.textColorToggle;
    const elem = document.querySelector(elements[request.id].querySelector);
    if (elements[request.id].textColorToggle) {
      changeTextColor(elem, elements[request.id].textColor);
    } else {
      changeTextColor(elem, elements[request.id].originalTextColor);
    }
    chrome.storage.sync.set({ elements });

  } else if (request.command === 'clear') {
    elements = {};
    chrome.storage.sync.set({ elements });
    alert('Cleared all elems');
    //refresh page
    window.location.reload();
  }
  else if (request.command === 'clearFromSite') {
    for (const id in elements) {
      if (elements[id].site === request.site) {
        delete elements[id];
      }
    }
    chrome.storage.sync.set({ elements });
    alert('Cleared elems from ' + request.site);
    //refresh page
    if (window.location.href === request.site) {
      window.location.reload();
    }
  } else if (request.command === 'setInitBgColor') {
    initialBgColor = request.color;
    chrome.storage.sync.set({ initialBgColor });
  } else if (request.command === 'setInitTextColor') {
    initialTextColor = request.textColor;
    chrome.storage.sync.set({ initialTextColor });
  }
});

// When the page is loaded, retrieve the state from storage
chrome.storage.sync.get('elements', function (data) {
  if (data.elements) {
    elements = data.elements;
    //wait for page to fully load
    setTimeout(() => {
      for (const id in elements) {
        const querySelector = elements[id].querySelector;
        const elem = document.querySelector(querySelector);
        if (elements[id].colorToggle && elements[id].site === window.location.href) {
          elem.style.background = elements[id].color;
        }
        if (elements[id].textColorToggle && elements[id].site === window.location.href) {
          changeTextColor(elem, elements[id].textColor);
        }
      }
    }, 2000);

  }
});

chrome.storage.sync.get('initialBgColor', function (data) {
  if (data.initialBgColor) {
    initialBgColor = data.initialBgColor;
  }
});

chrome.storage.sync.get('initialTextColor', function (data) {
  if (data.initialTextColor) {
    initialTextColor = data.initialTextColor;
  }
});

document.addEventListener('mouseover', function (e) {
  if (isSelecting) {
    if (selectedElem) {
      selectedElem.style.outline = '';
      selectedElem.style.boxShadow = '';
    }
    selectedElem = e.target;
    selectedElem.style.outline = '2px solid red';
    elem.style.boxShadow = 'inset 0 0 0 2px red';
  }
});

document.addEventListener('click', function (e) {
  if (isSelecting) {
    selectedElem.style.outline = '';
    selectedElem.style.boxShadow = '';
    e.preventDefault();
    const id = Date.now().toString();
    var query = getQuerySelector(selectedElem);
    elements[id] = {
      id,
      originalColor: selectedElem.style.backgroundColor,
      originalTextColor: selectedElem.style.color,
      color: initialBgColor,
      textColor: initialTextColor,
      querySelector: query,
      colorToggle: true,
      textColorToggle: true,
      site: window.location.href
    };
    chrome.storage.sync.set({ elements });
    selectedElem.style.background = initialBgColor;
    selectedElem.style.color = initialTextColor;
    isSelecting = false;
  }
});

const observer = new MutationObserver((mutationsList, observer) => {
  for (const id in elements) {
    const querySelector = elements[id].querySelector;
    const elem = document.querySelector(querySelector);
    if (elem) { // Check if the element exists
      if (elements[id].colorToggle && elements[id].site === window.location.href) {
        elem.style.background = elements[id].color;
      }
      if (elements[id].textColorToggle && elements[id].site === window.location.href) {
        changeTextColor(elem, elements[id].textColor);
      }
    }
  }
});

observer.observe(document, { childList: true, subtree: true });