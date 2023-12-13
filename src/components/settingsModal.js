import Switch from "react-switch";
import Modal from "react-modal";
import ColorPickerTool from './colorPickerTool';
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
function SettingsModal({ isOpen, onRequestClose }) {
    const [initialBgColor, setInitialBgColor] = useState(null)
    const [initialTextColor, setInitialTextColor] = useState(null)
    const [timeoutId, setTimeoutId] = useState(null);

    useEffect(() => {
        chrome.storage.sync.get('initialBgColor', function (data) {
            setInitialBgColor(initialBgColor || {});
        })
        chrome.storage.sync.get('initialTextColor', function (data) {
            setInitialTextColor(initialTextColor || {});
          })
      }, []);

    const clearAllElem = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { command: 'clear' });
        });
        setElements({});
    };

    const handleColorChange = (color) => {
        setInitialBgColor(color);
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        const newTimeoutId = setTimeout(() => {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { command: 'setInitBgColor', color: color});
            });
        }, 500);
        setTimeoutId(newTimeoutId);
    };

    const handleTextColorChange = (color) => {
        setInitialTextColor(color);
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const newTimeoutId = setTimeout(() => {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { command: 'setInitTextColor', textColor: color});
            });
        }, 500);
        setTimeoutId(newTimeoutId);
    }


    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            style={{
                overlay: {
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    zIndex: 1000,
                },
            }}
            className="bg-slate-900 text-white m-3 p-4 rounded-md mt-[60px]"
            contentLabel="settings modal"
        >
            <div className="flex flex-row mb-2">
                <button className=" hover:bg-slate-500 text-white text-2xl flex items-center align-middle justify-center rounded-full w-[35px] h-[35px] me-2 transition-all"
                    onClick={onRequestClose}>
                    <span className="mb-[4px] ms-[1px]">&times;</span>
                </button>
                <h1 className="text-2xl font-bold">settings</h1>
            </div>

            <div className="flex flex-row items-center justify-between mb-2">
                <p className="text-lg">Initial background color</p>
                <div
                    className="w-6 h-6 mr-2  cursor-pointer rounded-full"
                    style={{ border: '2px solid #fff', background: initialBgColor }}
                    id={`initBgColor`}
                >
                </div>
                <ColorPickerTool anchor={`#initBgColor`} initColor={initialBgColor} onChange={(color) => handleColorChange(color)} />
            </div>
            <div className="flex flex-row items-center justify-between mb-3">
                <p className="text-lg">Initial text color</p>
                <div
                    className="w-6 h-6 mr-2  cursor-pointer rounded-full"
                    style={{ border: '2px solid #fff', background: initialTextColor }}
                    id={`initTextColor`}
                >
                </div>
                <ColorPickerTool anchor={`#initTextColor`} initColor={initialTextColor} onChange={(color) => handleTextColorChange(color)} hideColorTypeBtns={true} />
            </div>
            {/* <div className="flex flex-row items-center justify-between mt-4 mb-4">
                <p className="text-lg">Show text color on hover</p>
                <Switch
                    onChange={() => { }}
                    checked={true}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    onColor="#3b82f6"
                    offColor="#aaa"
                    height={20}
                    width={40}
                />
            </div> */}

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
    )
}

export default SettingsModal;
