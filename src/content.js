let selectedElem = null;
let isSelecting = false;
let idCounter = 0;
let elements = {};

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
  } else if (request.command === 'removeElement') {
    document.querySelector(elements[request.id].querySelector).style.backgroundColor = elements[request.id].originalColor;
    changeTextColor(document.querySelector(elements[request.id].querySelector), elements[request.id].originalTextColor);
    delete elements[request.id];
    chrome.storage.sync.set({ elements });
  } else if (request.command === 'changeColor') {
    elements[request.id].color = request.color;
    chrome.storage.sync.set({ elements });
    document.querySelector(elements[request.id].querySelector).style.backgroundColor = elements[request.id].color;
  } else if (request.command === 'changeTextColor') {
    elements[request.id].textColor = request.textColor;
    chrome.storage.sync.set({ elements });
    const elem = document.querySelector(elements[request.id].querySelector);
    changeTextColor(elem, elements[request.id].textColor);
  } else if(request.command === 'changeColorToggle') {
    elements[request.id].colorToggle = request.colorToggle;
    if (elements[request.id].colorToggle) {
      document.querySelector(elements[request.id].querySelector).style.backgroundColor = elements[request.id].color;
    } else {
      document.querySelector(elements[request.id].querySelector).style.backgroundColor = elements[request.id].originalColor;
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
  }  else if (request.command === 'clear') {
    elements = {};
    chrome.storage.sync.clear();
    alert('Cleared');
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
        if (elements[id].colorToggle) {
          elem.style.backgroundColor = elements[id].color;
        }
        if (elements[id].textColorToggle) {
          changeTextColor(elem, elements[id].textColor);
        }
      }
    }, 2000);

  }
});

document.addEventListener('mouseover', function (e) {
  if (isSelecting) {
    if (selectedElem) {
      selectedElem.style.outline = '';
    }
    selectedElem = e.target;
    selectedElem.style.outline = '2px solid red';
  }
});

document.addEventListener('click', function (e) {
  if (isSelecting) {
    selectedElem.style.outline = '';
    e.preventDefault();
    const id = Date.now().toString();
    var query = getQuerySelector(selectedElem);
    elements[id] = {
      id,
      originalColor: selectedElem.style.backgroundColor,
      originalTextColor: selectedElem.style.color,
      color: '#000000',
      textColor: '#fff',
      querySelector: query,
      colorToggle: true,
      textColorToggle: true 
    };
    chrome.storage.sync.set({ elements });
    isSelecting = false;
  }
});

// Create a MutationObserver instance
const observer = new MutationObserver((mutationsList, observer) => {
  // if (!isEnabled) return;
  for (const id in elements) {
    const querySelector = elements[id].querySelector;
    if (elements[id].colorToggle) {
      document.querySelector(querySelector).style.backgroundColor = elements[id].color;
    }
    if (elements[id].textColorToggle){
      document.querySelector(querySelector).style.color = elements[id].textColor; 
    }
  }
});

// Start observing the document with the configured parameters
observer.observe(document, { childList: true, subtree: true });