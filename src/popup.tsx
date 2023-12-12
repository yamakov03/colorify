//// @ts-nocheck

import { useEffect, useState } from "react"
import ChromePicker from 'react-color';
import Switch from 'react-switch';
import "~style.css"
import { Tooltip } from 'react-tooltip'
import Modal from 'react-modal';
import Select from 'react-select';

function IndexPopup() {
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
  };

  const handleColorChangeComplete = (color, elemId) => {
    setElements(prevElems => { return { ...prevElems, [elemId]: { ...prevElems[elemId], color: color.hex } } })

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'changeColor', color: color.hex, id: elemId });
    });
  };

  const handleTextColorChangeComplete = (color, elemId) => {
    setElements(prevElems => { return { ...prevElems, [elemId]: { ...prevElems[elemId], textColor: color.hex } } })

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'changeTextColor', textColor: color.hex, id: elemId });
    });
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
      chrome.tabs.sendMessage(tabs[0].id, { command: 'clearFromSite', site: site});
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

  return (
    <div className="w-[370px] h-[500px] bg-slate-900 text-white">
      <div className="sticky top-0 bg-slate-900 drop-shadow-sm mx-3 pt-4 mb-2 border-b-[1px] border-gray-500">
        <button
          onClick={handleAddElem}
          id="selectElem"
          className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded me-2"
        >
          Select Elem
        </button>
        <Tooltip anchorSelect="#selectElem" clickable className="z-50">
          Hover over and double click an element to select it
        </Tooltip>
        <button
          onClick={openModal}
          id="enterElem"
          className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded me-2"
        >
          Enter Elem
        </button>
        <Tooltip anchorSelect="#enterElem" clickable className="z-50">
          Enter a selector string to select an element
        </Tooltip>

        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          className="bg-slate-900 text-white m-4 me-8 p-4 rounded-md mt-[60px] flex"
          contentLabel="Example Modal"
        >
          <span className="text-2xl cursor-pointer flex-1" onClick={closeModal}>&times;</span>
          <input
            type="text"
            className="rounded-[4px] text-black px-2 me-2"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
          />
          <button
            onClick={() => {
              addElemByQuery(queryInput);
              closeModal();
            }}
            id="enterElem"
            className=" bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded me-2"
          >
            Add
          </button>
        </Modal>

        <button
          onClick={clearAllElem}
          className="mb-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-2 rounded me-7"
        >
          Clear all
        </button>
        <a id="clickable" className="cursor-pointer">◕‿‿◕</a>
        <Tooltip anchorSelect="#clickable" clickable className="z-50">
          Hello! Add an element to get started.
        </Tooltip>

        <Select
          className="mb-3 z-40"
          placeholder="Search sites..."
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
              <button className="bg-red-500 hover:bg-red-700 text-white text-lg font-bold flex items-center align-middle justify-center rounded-full w-[25px] h-[25px]"
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
                  style={{ border: elem.colorToggle ? '4px solid #3b82f6' : '2px solid transparent', backgroundColor: elem.color }}
                  id={`color-elem-${elem.id}`}
                  onClick={() => handleColorToggle(elem.id)}
                >
                </div>
                <div
                  className="w-6 h-6 mr-2  cursor-pointer rounded-full"
                  style={{ border: elem.textColorToggle ? '4px solid #3b82f6' : '2px solid transparent', backgroundColor: elem.textColor }}
                  id={`text-elem-${elem.id}`}
                  onClick={() => handleTextColorToggle(elem.id)}
                >
                </div>
                <p className="flex-1 truncate ps-2 pe-3" id={`selector-${elem.id}`}>{elem.querySelector}</p>
                {/* <Tooltip anchorSelect={`#selector-${elem.id}`} clickable className="z-50">
                  <p>{elem.querySelector}</p>
                </Tooltip> */}
                <Tooltip anchorSelect={`#color-elem-${elem.id}`} clickable className="z-50">
                  <ChromePicker color={elem.color} onChangeComplete={(color) => handleColorChangeComplete(color, elem.id)} />
                </Tooltip>
                <Tooltip anchorSelect={`#text-elem-${elem.id}`} clickable className="z-50">
                  <ChromePicker color={elem.textColor} onChangeComplete={(color) => handleTextColorChangeComplete(color, elem.id)} />
                </Tooltip>
                <button className=" hover:bg-slate-500 text-white text-lg font-bold flex items-center align-middle justify-center rounded-full w-[25px] h-[25px]"
                  onClick={() => handleRemoveElem(elem.id)}>
                  <span className="mb-[2px]">&times;</span>
                </button>
              </div>
            ))}
          </div>
        ))}



      </div>
    </div>
  );
}

export default IndexPopup
