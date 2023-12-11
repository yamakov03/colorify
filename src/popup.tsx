 // @ts-nocheck

import { useEffect, useState } from "react"
import ChromePicker from 'react-color';
import Switch from 'react-switch';
import "~style.css"
import { Tooltip } from 'react-tooltip'


function IndexPopup() {
  const [elements, setElements] = useState({});

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

  return (
    <div className="p-4 w-[300px] h-[400px]">

      <button
        onClick={handleAddElem}
        className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded me-4"
      >
        Add Elem
      </button>
      <button
        onClick={clearAllElem}
        className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded me-4"
      >
        Clear all
      </button>
      <a id="clickable" className="cursor-pointer">◕‿‿◕</a>
      <Tooltip anchorSelect="#clickable" clickable>
        Hello! Add an element to get started.
      </Tooltip>
      <p>bg text</p>
      {Object.values(elements).map((elem) => (
        <div key={elem.id} className="flex items-center mb-4" >
          <div
            className="w-6 h-6 mr-2  cursor-pointer rounded-full"
            style={{ border: elem.colorToggle ? '4px solid #3b82f6' : '2px solid transparent', backgroundColor: elem.color}}
            id={`color-elem-${elem.id}`}
            onClick={() => handleColorToggle(elem.id)}
          >
          </div>
          <div
            className="w-6 h-6 mr-2  cursor-pointer rounded-full"
            style={{ border: elem.textColorToggle ? '4px solid #3b82f6' : '2px solid transparent', backgroundColor: elem.textColor}}
            id={`text-elem-${elem.id}`}
            onClick={() => handleTextColorToggle(elem.id)}
          >
          </div>
          <p className="flex-1">{elem.id}</p>
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
      ))}
    </div>
  );
}

export default IndexPopup
