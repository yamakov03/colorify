import { Tooltip } from 'react-tooltip'
import { useState } from "react";
import ColorPicker from 'react-best-gradient-color-picker'

function ColorPickerTool({ anchor, initColor, onChange, hideColorTypeBtns: hideColorTypeBtns = false }) {
    const [color, setColor] = useState(initColor);
    return (
        <Tooltip
            anchorSelect={anchor}
            opacity={1}
            place="right"
            clickable
            className="z-50"
            afterShow={() => setColor(initColor)}>

            <ColorPicker
                value={color}
                width={200}
                height={100}
                hideColorTypeBtns={hideColorTypeBtns}
                hideAdvancedSliders={true}
                hidePresets={true}
                hideColorGuide={true}
                onChange={(newColor) => {
                    setColor(newColor)
                    onChange(newColor)
                }}
            />
        </Tooltip>
    )
}

export default ColorPickerTool;