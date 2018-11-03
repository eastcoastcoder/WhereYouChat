import React, { Component } from 'react';
import { css } from 'react-emotion';

import Message from './Message';
import withGlobalState from '../../../contexts/withGlobalState';


class MessageList extends Component {
  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom = () => {
    const { scrollHeight } = this.messageList;
    const height = this.messageList.clientHeight;
    const maxScrollTop = scrollHeight - height;
    this.messageList.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  }

  render() {
    const { messages } = this.props;
    return (
      <div className={MessageListStyle} ref={div => this.messageList = div}>
        {messages.map(message => (
          <Message key={message.id} message={message} />
        ))}
      </div>
    );
  }
}

const MessageListStyle = css`
  box-sizing: border-box;
  padding: 0 6px 0 6px;
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: scroll;
  background: white;
`;

export default withGlobalState(MessageList);
