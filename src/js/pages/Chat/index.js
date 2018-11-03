import React, { Component } from 'react';
import { Page } from 'react-onsenui';

import Header from '../../components/Header';
import MessageList from './MessageList';
import SendMessageForm from './SendMessageForm';

class Chat extends Component {
  renderToolbar = () => <Header title="Chat" />;

  render() {
    return (
      <Page renderToolbar={this.renderToolbar}>
        <MessageList />
        <SendMessageForm />
      </Page>
    );
  }
}

export default Chat;
