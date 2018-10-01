import React from 'react';
import { css } from 'react-emotion';

const Message = ({ message: { senderId, text } }) => (
  <div className={MessageStyle}>
    <div>{senderId}</div>
    <div>{text}</div>
  </div>
);

const MessageStyle = css`
  margin: 15px 0;
  & div:nth-child(1) {
    font-size: 11px;
    color: var(--main-text-color);
    opacity: 0.9;
    margin-bottom: 6px;
  }
  & div:nth-child(2) {
    background: var(--main-color);
    color: var(--secondary-color);
    display: inline;
    padding: 4px 8px;
    border-radius: 8px;
  }
`;

export default Message;
