import React from 'react';
import { css } from 'react-emotion';

const MessageList = ({ messages }) => (
  <ul className={MessageListStyle}>
    {messages.map(message => (
      <li key={message.id} className={MessageStyle}>
        <div>{message.senderId}</div>
        <div>{message.text}</div>
      </li>
     ))}
  </ul>);

const MessageListStyle = css`
  box-sizing: border-box;
  padding: 0 0 0 6px;
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: scroll;
  background: white;
`;

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

export default MessageList;
