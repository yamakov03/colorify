//// @ts-nocheck

import { useEffect, useState } from "react"
import "~style.css"
import { Tooltip } from 'react-tooltip'
import Modal from 'react-modal';
import Select from 'react-select';
import ColorPickerTool from "~components/colorPickerTool";
import icon from "data-base64:~assets/icon.png";

function IndexPopup() {
  const [elements, setElements] = useState({});
  const [elemModalIsOpen, setElemModalIsOpen] = useState(false);
  const [settingsModalIsOpen, setSettingsModalIsOpen] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const [initialBgColor, setInitialBgColor] = useState('#000')
  const [initialTextColor, setInitialTextColor] = useState('#fff')

  const [queryInput, setQueryInput] = useState('');
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(() => {
    const savedState = localStorage.getItem('isOpen');
    return savedState ? JSON.parse(savedState) : {};
  });

  function openModal() {
    setElemModalIsOpen(true);
  }

  function closeModal() {
    setElemModalIsOpen(false);
  }

  const toggleOpen = (site) => {
    setIsOpen(prevState => ({ ...prevState, [site]: !prevState[site] }));
  };

  useEffect(() => {
    chrome.storage.sync.get('elements', function (data) {
      setElements(data.elements || {});
    })
    chrome.storage.sync.get('initialBgColor', function (data) {
      setInitialBgColor(data.initialBgColor || '#000');
    })
    chrome.storage.sync.get('initialTextColor', function (data) {
      setInitialTextColor(data.initialTextColor || '#fff');
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


  const handleColorChange = (color, id) => {
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

  const handleInitColorChange = (color) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const newTimeoutId = setTimeout(() => {
      setInitialBgColor(color);
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { command: 'setInitBgColor', color: color });
      });
    }, 100);
    setTimeoutId(newTimeoutId);
  };

  const handleInitTextColorChange = (color) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      setInitialTextColor(color);
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { command: 'setInitTextColor', textColor: color });
      });
    }, 100);
    setTimeoutId(newTimeoutId);
  }

  const clearAllElem = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'clear' });
    });
    setElements({});
  };

  return (
    <>
      <div className="w-[370px] h-[600px] bg-slate-900 text-white flex flex-col">
        <div className="sticky top-0 bg-slate-900 drop-shadow-sm mx-3 pt-4 mb-2 border-b-[1px] border-gray-500 z-[1] ">
          <div className="flex mb-2 justify-between">
            <h1 className="text-2xl font-bold">colorify.</h1>
            <div className="flex align-middle">
              <a id="clickable" className="cursor-pointer mt-1 me-3">◕‿‿◕</a>
              <button className="hover:bg-slate-500 text-white text-lg flex items-center align-middle justify-center rounded-full w-[30px] h-[30px] ms-3 transition-all"
                onClick={() => setSettingsModalIsOpen(true)}>
                <span className="mb-[3px] text-3xl">⚙</span>
              </button>

              <Modal
                isOpen={settingsModalIsOpen}
                onRequestClose={() => setSettingsModalIsOpen(false)}
                style={{
                  overlay: {
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    zIndex: 1000,
                  },
                }}
                className="bg-slate-900 text-white m-3 p-4 rounded-md mt-[55px]"
                contentLabel="settings modal"
              >
                <div className="flex flex-row mb-2">
                  <button className=" hover:bg-slate-500 text-white text-2xl flex items-center align-middle justify-center rounded-full w-[35px] h-[35px] me-2 transition-all"
                    onClick={() => setSettingsModalIsOpen(false)}>
                    <span className="mb-[4px] ms-[1px]">&times;</span>
                  </button>
                  <h1 className="text-2xl font-bold">settings</h1>
                </div>

                <div className="flex flex-row items-center justify-between mb-2">
                  <p className="text-lg">Initial background color</p>
                  <div className="flex align-middle">
                    {initialBgColor !== '#000' && (
                      <button className="hover:bg-slate-500 mr-2 text-white text-lg flex items-center align-middle justify-center rounded-full w-[25px] h-[25px] transition-all"
                        onClick={() => handleInitColorChange('#000')}>
                        <span className="mb-[0px]">⏎</span>
                      </button>
                    )}
                    <div
                      className="w-6 h-6 cursor-pointer rounded-full"
                      style={{ border: '2px solid #fff', background: initialBgColor }}
                      id={`initBgColor`}
                    >
                    </div>

                  </div>

                  <ColorPickerTool anchor={`#initBgColor`} initColor={initialBgColor} onChange={(color) => handleInitColorChange(color)} />
                </div>
                <div className="flex flex-row items-center justify-between mb-3">
                  <p className="text-lg">Initial text color</p>
                  <div className="flex align-middle">
                    {initialTextColor !== '#fff' && (
                      <button className="hover:bg-slate-500 mr-2 text-white text-lg flex items-center align-middle justify-center rounded-full w-[25px] h-[25px] transition-all"
                        onClick={() => handleInitTextColorChange('#fff')}>
                        <span className="mb-[0px]">⏎</span>
                      </button>
                    )}
                    <div
                      className="w-6 h-6 cursor-pointer rounded-full"
                      style={{ border: '2px solid #fff', background: initialTextColor }}
                      id={`initTextColor`}
                    >
                    </div>

                  </div>
                  <ColorPickerTool anchor={`#initTextColor`} initColor={initialTextColor} onChange={(color) => handleInitTextColorChange(color)} hideColorTypeBtns={true} />
                </div>

                <button
                  onClick={clearAllElem}
                  id="clearElems"
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-2 rounded me-7 transition-all w-full"
                >
                  Clear all elements
                </button>
                <Tooltip anchorSelect="#clearElems" clickable className="z-50">
                  Clears all elements globally
                </Tooltip>
              </Modal>



            </div>

          </div>
          <div className="flex flex-row items-center mb-2">
            <button
              onClick={handleAddElem}
              id="selectElem"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded me-2 transition-all h-[38px]"
            >
              Select by Click
            </button>
            <Tooltip anchorSelect="#selectElem" clickable className="z-50">
              Hover and double click an element to select it
            </Tooltip>
            <button
              onClick={openModal}
              id="enterElem"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded me-2 transition-all  h-[38px]"
            >
              Select by Query
            </button>
            <Tooltip anchorSelect="#enterElem" clickable className="z-50">
              Enter a selector string to select an element
            </Tooltip>
          </div>

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

          <Modal
            ariaHideApp={false}
            isOpen={elemModalIsOpen}
            onRequestClose={closeModal}
            style={{
              overlay: {
                backgroundColor: 'rgba(0,0,0,0.7)',
                zIndex: 1000,
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



          <div className="flex flex-row text-gray-500">
            <p className="ms-2 me-3">BG</p>
            <p className="me-[110px]">Text</p>
            <p>Query</p>
          </div>
        </div>
        <div className="px-3 overflow-y-scroll bg-slate-900 pb-[90px] ">
          {Object.keys(filteredElements).length === 0 && (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-lg font-bold text-gray-400">No elements yet (˶˃ᆺ˂˶)</p>
              <p className="text-md text-gray-400">Try adding some 👆 </p>
            </div>)}

          {Object.entries(filteredElements).map(([site, elems]) => (
            <div className={`mb-2 bg-slate-800 ${!isOpen[site] && "hover:bg-slate-700"} rounded-md p-1`} key={site}>
              <div className={`text-md p-1 flex justify-between items-center ms-1 cursor-pointer ${isOpen[site] && "mb-2"}`} onClick={() => toggleOpen(site)}>
                <div className="flex flex-row items-center">
                  <span className={`chevron me-2 ${isOpen[site] ? 'rotate' : ''}`}></span>
                  {/* <p className="w-[250px]">{site}</p> */}
                  <p className="truncate ps-2 pe-3 cursor-pointer hover:underline w-[280px]"
                    onClick={() => { navigator.clipboard.writeText(site) }}
                  >{site}</p>
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

                  <ColorPickerTool anchor={`#color-elem-${elem.id}`} initColor={elem.color} onChange={(color) => handleColorChange(color, elem.id)} hideColorTypeBtns={false} />
                  <ColorPickerTool anchor={`#text-elem-${elem.id}`} initColor={elem.textColor} onChange={(color) => handleTextColorChange(color, elem.id)} hideColorTypeBtns={true} />

                  <button className=" hover:bg-slate-500 text-white text-lg flex items-center align-middle justify-center rounded-full w-[25px] h-[25px] transition-all"
                    onClick={() => handleRemoveElem(elem.id)}>
                    <span className="mb-[2px]">&times;</span>
                  </button>
                </div>
              ))}
            </div>
          ))}



        </div>
        <div className="absolute bottom-0 p-2 w-full z-10 bg-slate-900 ">
          <div className="flex flex-row items-center justify-center bg-slate-900 ">
            <a href="https://www.buymeacoffee.com/yamakov" target="_blank" rel="noreferrer" className="me-2 hover:opacity-100 opacity-90 transition-all">
              <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" className="w-[110px] h-[30px]" />
            </a>
            <a href="https://www.producthunt.com/posts/colorify-2" target="_blank" rel="noreferrer" className="flex flex-row gap-2 items-center hover:opacity-100 opacity-90 transition-all ">
              <img src={icon} alt="Colorify - A chrome extension to color webpage elements" className="w-[30px]" />
              <p className="text-xs ">Colorify on<br></br>ProductHunt</p>
            </a>
          </div>
          <div className="flex flex-row gap-2 justify-center align-middle w-full mt-2">
            <a href="https://github.com/yamakov03/colorify/blob/master/SECURITY.md" target="_blank" rel="noreferrer" className="text-gray-500 hover:underline">Privacy</a>
            <a href="https://github.com/yamakov03/colorify" target="_blank" rel="noreferrer" className="text-gray-500 hover:underline">GitHub</a>
            <a href="https://yamakov.tech/" target="_blank" rel="noreferrer" className="text-gray-500 hover:underline">Made by Daniel</a>
            <a href="https://github.com/yamakov03/colorify/issues/new" target="_blank" rel="noreferrer" className="text-gray-500 hover:underline">Help</a>
          </div>
        </div>
      </div>


    </>
  );
}

export default IndexPopup
