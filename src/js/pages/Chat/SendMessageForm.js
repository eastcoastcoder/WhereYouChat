import React, { useState } from 'react';
import { css } from 'react-emotion';

import withGlobalState from '../../contexts/withGlobalState';

const SendMessageForm = ({ sendMessage }) => {
  const [message, setMessage] = useState('');

  const handleChange = ({ target: { value } }) => {
    setMessage(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(message);
    setMessage('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={SendMessageFormStyle}
    >
      <input
        onChange={handleChange}
        value={message}
        placeholder="Type your message and hit ENTER"
        type="text"
      />
    </form>
  );
};

const SendMessageFormStyle = css`
  background: var(--send-message-form);
  display: flex;
  box-sizing: border-box;
  height: 60px;
  & input {
    width: 100%;
    padding: 15px 10px;
    border: none;
    margin: 0;
    background: var(--send-message-form);
    font-weight: 200;
  }
  & input:focus {
    outline-width: 0;
  }
  & input::placeholder {
    color: black;
  }
`;

export default withGlobalState(SendMessageForm);
