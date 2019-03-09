import React from 'react';
import styled from 'react-emotion';

const Message = ({ message: { senderId, parts } }) => (
  <StyledMessage senderId={senderId}>
    <div>{senderId}</div>
    <div>{parts[0].payload.content}</div>
  </StyledMessage>
);

const StyledMessage = styled('div')`
  margin: 15px 0;
  // RTL for self posted messages
  direction: ${({ senderId }) => senderId === 'perborgen' && 'rtl'};
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
