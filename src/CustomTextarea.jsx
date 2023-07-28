import React from 'react';
import './CustomTextarea.css';

function CustomTextarea({ instructions, placeholder, infoSetter, value }) {

  React.useEffect(() => {
    infoSetter(value);
    // eslint-disable-next-line
  }, []);

  return (
    <div id="textarea">
      <div>
        <label htmlFor={instructions} className="custom-label">
          {instructions}
        </label>
      </div>
      <textarea
        id={instructions}
        placeholder={placeholder}
        value={value}
        required
        rows={4}
        className="custom-textarea"
        onChange={(event) => {
          infoSetter(event.target.value);
        }}
      />
    </div>
  )
}

export default CustomTextarea;
