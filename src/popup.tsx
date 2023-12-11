//// @ts-nocheck

import { useEffect, useState } from "react"
import ChromePicker from 'react-color';
import Switch from 'react-switch';
import "~style.css"
import { Tooltip } from 'react-tooltip'
import Modal from 'react-modal';

function IndexPopup() {
  const [elements, setElements] = useState({});
  const [modalIsOpen, setIsOpen] = useState(false);
  const [queryInput, setQueryInput] = useState('');

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  useEffect(() => {
    chrome.storage.sync.get('elements', function (data) {
      setElements(data.elements || {});
    })
  }, []);

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

  return (
    <div className="w-[350px] h-[500px] overflow-y-auto bg-slate-900 text-white">
      <div className="sticky top-0 bg-slate-900 drop-shadow-sm mx-4 pt-4 mb-2 border-b-[1px] border-white">
        <button
          onClick={handleAddElem}
          id="selectElem"
          className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded me-2"
        >
          Select Elem
        </button>
        <Tooltip anchorSelect="#selectElem" clickable>
          Hover over and double click an element to select it
        </Tooltip>
        <button
          onClick={openModal}
          id="enterElem"
          className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded me-2"
        >
          Enter Elem
        </button>
        <Tooltip anchorSelect="#enterElem" clickable>
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
          className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded me-2"
        >
          Clear all
        </button>
        <a id="clickable" className="cursor-pointer">◕‿‿◕</a>
        <Tooltip anchorSelect="#clickable" clickable>
          Hello! Add an element to get started.
        </Tooltip>
        <div className="flex flex-row gap-4 ms-1">

          <p >BG</p>
          <p>Text</p>
          <p>Query</p>
        </div>
      </div>
      <div className="px-3">

        {Object.values(elements).map((elem) => (
          <>
            <div key={elem.id} className="flex items-center p-1 hover:bg-slate-700 rounded-md " id={`elem-${elem.id}`} onMouseOver={() => highlightElem(elem.querySelector)}>
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
              <p className="flex-1 truncate ps-2 pe-3">{elem.querySelector}</p>
              <Tooltip anchorSelect={`#color-elem-${elem.id}`} clickable>
                <ChromePicker color={elem.color} onChangeComplete={(color) => handleColorChangeComplete(color, elem.id)} />
              </Tooltip>
              <Tooltip anchorSelect={`#text-elem-${elem.id}`} clickable>
                <ChromePicker color={elem.textColor} onChangeComplete={(color) => handleTextColorChangeComplete(color, elem.id)} />
              </Tooltip>
              <button
                onClick={() => handleRemoveElem(elem.id)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Remove
              </button>
            </div>
          </>

        ))}
      </div>
    </div>
  );
}

export default IndexPopup
