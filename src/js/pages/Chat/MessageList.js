import React from 'react';

const MessageList = ({ messages }) => (
  <ul className="message-list">
    {messages.map(message => (
      <li key={message.id} className="message">
        <div>{message.senderId}</div>
        <div>{message.text}</div>
      </li>
     ))}
  </ul>);

export default MessageList;
