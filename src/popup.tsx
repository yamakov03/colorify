//// @ts-nocheck

import { useEffect, useState } from "react"
import ChromePicker from 'react-color';
import Switch from 'react-switch';
import "~style.css"
import { Tooltip } from 'react-tooltip'
import Modal from 'react-modal';
import Select from 'react-select';
import ColorPicker from 'react-best-gradient-color-picker'

function IndexPopup() {
  const [color, setColor] = useState('rgba(255,255,255,1)');
  const [elements, setElements] = useState({});
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [queryInput, setQueryInput] = useState('');
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(() => {
    const savedState = localStorage.getItem('isOpen');
    return savedState ? JSON.parse(savedState) : {};
  });

  function openModal() {
    setModalIsOpen(true);
  }

  function closeModal() {
    setModalIsOpen(false);
  }

  const toggleOpen = (site) => {
    setIsOpen(prevState => ({ ...prevState, [site]: !prevState[site] }));
  };

  useEffect(() => {
    chrome.storage.sync.get('elements', function (data) {
      setElements(data.elements || {});
    })
  }, []);

  useEffect(() => {
    localStorage.setItem('isOpen', JSON.stringify(isOpen));
  }, [isOpen]);

  const handleAddElem = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'start' });
    });
  };

  const addElemByQuery = (query) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'addByQuery', querySelector: query });
    });
    //wait 2 seconds for the element to be added
    setTimeout(() => {
      chrome.storage.sync.get('elements', function (data) {
        setElements(data.elements || {});
      })
    }, 500);
  };

  const handleRemoveElem = (elemId) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'removeElement', id: elemId });
    });
    setElements(prevElems => { delete prevElems[elemId]; return { ...prevElems } });
  };

  const clearAllElem = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'clear' });
    });
    setElements({});
  };

  const handleColorToggle = (elemId) => {
    setElements(prevElems => { return { ...prevElems, [elemId]: { ...prevElems[elemId], colorToggle: !prevElems[elemId].colorToggle } } })
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'changeColorToggle', colorToggle: !elements[elemId].colorToggle, id: elemId });
    });
  };

  const handleTextColorToggle = (elemId) => {
    setElements(prevElems => { return { ...prevElems, [elemId]: { ...prevElems[elemId], textColorToggle: !prevElems[elemId].textColorToggle } } })
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'changeTextColorToggle', textColorToggle: !elements[elemId].textColorToggle, id: elemId });
    });
  }

  const highlightElem = (querySelector) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'highlightElem', querySelector });
    });
  }

  const unhighlightElem = (querySelector) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'unhighlightElem', querySelector });
    });
  }

  const clearSite = (site) => {
    setElements(prevElems => {
      const newElems = { ...prevElems };
      Object.keys(newElems).forEach((key) => {
        if (newElems[key].site === site) {
          delete newElems[key];
        }
      });
      return newElems;
    });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'clearFromSite', site: site });
    });
  };

  const groupedElements = Object.values(elements).reduce((groups, elem) => {
    const key = elem.site;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(elem);
    return groups;
  }, {});

  const options = Object.keys(groupedElements).map(website => ({ value: website, label: website }));

  const filteredElements = search
    ? Object.keys(groupedElements)
      .filter(website => website.toLowerCase().includes(search.toLowerCase()))
      .reduce((result, website) => {
        result[website] = groupedElements[website];
        return result;
      }, {})
    : groupedElements;

  const [timeoutId, setTimeoutId] = useState(null);

  const handleColorChange = (color, id) => {
    // Clear the previous timeout if there is one
    setColor(color);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout
    const newTimeoutId = setTimeout(() => {
      // Update the color after a delay
      setElements(prevElems => { return { ...prevElems, [id]: { ...prevElems[id], color: color } } })
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { command: 'changeColor', color: color, id: id });
      });
    }, 500); // 500ms delay

    // Save the timeout ID so it can be cleared later
    setTimeoutId(newTimeoutId);
  };

  const handleTextColorChange = (color, id) => {
    setColor(color);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      setElements(prevElems => { return { ...prevElems, [id]: { ...prevElems[id], textColor: color } } })
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { command: 'changeTextColor', textColor: color, id: id });
      });
    }, 500);
    setTimeoutId(newTimeoutId);
  }

  return (
    <div className="w-[370px] h-[500px] bg-slate-900 text-white">
      <div className="sticky top-0 bg-slate-900 drop-shadow-sm mx-3 pt-4 mb-2 border-b-[1px] border-gray-500">
        <div className="flex mb-2 justify-between">
          <h1 className="text-2xl font-bold">colorify</h1>
          <div className="flex align-middle">
            <a id="clickable" className="cursor-pointer mt-1 me-3">◕‿‿◕</a>
            <Tooltip anchorSelect="#clickable" clickable className="z-50" place="right">
              Hello! Add an element to get started.
            </Tooltip>
            <button className="hover:bg-slate-500 text-white text-lg flex items-center align-middle justify-center rounded-full w-[30px] h-[30px] ms-3 transition-all"
              onClick={() => chrome.runtime.openOptionsPage()}>
              <span className="mb-[3px] text-3xl">⚙</span>
            </button>

          </div>

        </div>

        <button
          onClick={handleAddElem}
          id="selectElem"
          className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded me-2 transition-all"
        >
          Select Elem
        </button>
        <Tooltip anchorSelect="#selectElem" clickable className="z-50">
          Hover and double click an element to select it
        </Tooltip>
        <button
          onClick={openModal}
          id="enterElem"
          className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded me-2 transition-all"
        >
          Enter Elem
        </button>
        <Tooltip anchorSelect="#enterElem" clickable className="z-50">
          Enter a selector string to select an element
        </Tooltip>

        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          style={{
            overlay: {
              backgroundColor: 'rgba(0,0,0,0.7)',
            },
          }}
          className="bg-slate-900 text-white m-3 p-4 rounded-md mt-[60px] flex"
          contentLabel="Example Modal"
        >
          <button className=" hover:bg-slate-500 text-white text-2xl flex items-center align-middle justify-center rounded-full w-[35px] h-[35px] me-2 transition-all"
            onClick={closeModal}>
            <span className="mb-[4px] ms-[1px]">&times;</span>
          </button>
          <input
            type="text"
            placeholder="Enter a selector string"
            className="rounded-[4px] text-white bg-slate-800 px-2 me-2 w-[200px]"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
          />
          <button
            onClick={() => {
              addElemByQuery(queryInput);
              closeModal();
            }}
            className=" bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded me-2 transition-all"
          >
            Add
          </button>
        </Modal>

        <button
          onClick={clearAllElem}
          id="clearElems"
          className="mb-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-2 rounded me-7 transition-all"
        >
          Clear all
        </button>
        <Tooltip anchorSelect="#clearElems" clickable className="z-50">
          Clear all elements
        </Tooltip>


        <Select
          className="mb-3 z-40"
          placeholder="Search..."
          isClearable
          isSearchable
          options={options}
          onChange={(e) => e != null ? setSearch(e.value) : setSearch('')}
          menuPortalTarget={document.body}
          styles={{
            menuPortal: base => ({ ...base, zIndex: 9999, color: '#fff' }),
          }}
          theme={(theme) => ({
            ...theme,
            colors: {
              ...theme.colors,
              primary25: '#3b82f6',
              primary: '#3b82f6',
              neutral0: '#1f2937',
              neutral20: '#3b82f6',
              neutral30: '#3b82f6',
              neutral40: '#3b82f6',
              neutral50: '#aaa',
              neutral60: '#fff',
              neutral70: '#fff',
              neutral80: '#fff',
              neutral90: '#fff',
            },
            //set z index to 50 so it shows up above the tooltip
          })}
        />

        <div className="flex flex-row text-gray-500">
          <p className="ms-2 me-3">BG</p>
          <p className="me-[110px]">Text</p>
          <p>Query</p>
        </div>
      </div>
      <div className="px-3 overflow-y-auto">
        {Object.entries(filteredElements).map(([site, elems]) => (
          <div className={`mb-2 bg-slate-800 ${!isOpen[site] && "hover:bg-slate-700"} rounded-md p-1`} key={site}>
            <div className={`text-md p-1 flex justify-between items-center ms-1 cursor-pointer ${isOpen[site] && "mb-2"}`} onClick={() => toggleOpen(site)}>
              <div className="flex flex-row items-center">
                <span className={`chevron me-2 z-10 ${isOpen[site] ? 'rotate' : ''}`}></span>
                <p>{site}</p>
              </div>
              <button className="bg-red-500 hover:bg-red-700 text-white text-lg flex items-center align-middle justify-center rounded-full w-[25px] h-[25px] transition-all"
                onClick={() => clearSite(site)}>
                <span className="mb-[2px]">&times;</span>
              </button>
            </div>
            {isOpen[site] && Object.values(elems).map((elem) => (
              <div key={elem.id} className="flex items-center p-1 hover:bg-slate-700 bg-slate-800 rounded-md" id={`elem-${elem.id}`}
                onMouseOver={() => highlightElem(elem.querySelector)}
                onMouseLeave={() => unhighlightElem(elem.querySelector)}>
                <div
                  className="w-6 h-6 mr-2  cursor-pointer rounded-full"
                  style={{ border: elem.colorToggle ? '4px solid #3b82f6' : '2px solid transparent', background: elem.color }}
                  id={`color-elem-${elem.id}`}
                  onClick={() => handleColorToggle(elem.id)}
                >
                </div>
                <div
                  className="w-6 h-6 mr-2  cursor-pointer rounded-full"
                  style={{ border: elem.textColorToggle ? '4px solid #3b82f6' : '2px solid transparent', background: elem.textColor }}
                  id={`text-elem-${elem.id}`}
                  onClick={() => handleTextColorToggle(elem.id)}
                >
                </div>

                <p className="flex-1 truncate ps-2 pe-3 cursor-pointer hover:underline" id={`selector-${elem.id}`}
                  onClick={() => { navigator.clipboard.writeText(elem.querySelector) }}
                >{elem.querySelector}</p>

                <Tooltip
                  anchorSelect={`#color-elem-${elem.id}`}
                  opacity={1}
                  place="right"
                  clickable
                  className="z-50"
                  afterShow={() => setColor(elem.color)}>

                  <ColorPicker
                    value={color}
                    width={200}
                    height={100}
                    hideAdvancedSliders={true}
                    hidePresets={true}
                    hideColorGuide={true}
                    onChange={(color) => handleColorChange(color, elem.id)}
                  />
                </Tooltip>
                <Tooltip
                  anchorSelect={`#text-elem-${elem.id}`}
                  opacity={1}
                  place="right"
                  clickable
                  className="z-50"
                  afterShow={() => setColor(elem.textColor)}
                >
                  <ColorPicker

                    value={color}
                    width={200}
                    height={100}
                    hideColorTypeBtns={true}
                    hideGradientControls={true}
                    hideAdvancedSliders={true}
                    hidePresets={true}
                    hideColorGuide={true}
                    onChange={(color) => handleTextColorChange(color, elem.id)}
                  />
                </Tooltip>
                <button className=" hover:bg-slate-500 text-white text-lg flex items-center align-middle justify-center rounded-full w-[25px] h-[25px] transition-all"
                  onClick={() => handleRemoveElem(elem.id)}>
                  <span className="mb-[2px]">&times;</span>
                </button>
              </div>
            ))}
          </div>
        ))}



      </div>
      <div className="absolute bottom-0 p-2 w-full">
        
        <div className="flex flex-row items-center justify-center bg-slate-900 ">
          <a href="https://www.buymeacoffee.com/" target="_blank" rel="noreferrer" className="me-2 hover:opacity-100 opacity-90 transition-all">
            <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" className="w-[150px] h-[40px]" />
          </a>
          <a href="https://www.producthunt.com/posts/colorify?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-colorify" target="_blank" rel="noreferrer" className="flex flex-row gap-2 items-center hover:opacity-100 opacity-90 transition-all">
            <img src="https://ph-files.imgix.net/de145cb2-d576-4a81-bcb0-6fbfe69cce33.jpeg?auto=compress&codec=mozjpeg&cs=strip&auto=format&w=48&h=48&fit=max&bg=0fff&dpr=1" alt="Colorify - A chrome extension to color webpage elements" className="w-[40px]" />
            <p className="text-xs">Colorify on<br></br>ProductHunt</p>
          </a>
        </div>
        <div className="flex flex-row gap-2 justify-center align-middle w-full mt-1">
        <a href="google.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:underline">Privacy</a>
          <a href="google.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:underline">GitHub</a>
          <a href="google.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:underline">Made by Daniel</a>
          <a href="google.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:underline">Help</a>
        </div>
      </div>

    </div>
  );
}

export default IndexPopup
