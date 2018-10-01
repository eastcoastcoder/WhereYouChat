import React, { Component } from 'react';
import { Page } from 'react-onsenui';
import Chatkit from '@pusher/chatkit';

import Header from '../../components/Header';
import MessageList from './MessageList';
import SendMessageForm from './SendMessageForm';

const testToken = 'https://us1.pusherplatform.io/services/chatkit_token_provider/v1/dfaf1e22-2d33-45c9-b4f8-31f634621d24/token';
const instanceLocator = 'v1:us1:dfaf1e22-2d33-45c9-b4f8-31f634621d24';
const roomId = 9806194;
const username = 'perborgen';

class Chat extends Component {
  renderToolbar = () => <Header title="Chat" />;

  state = {
    messages: [],
  };
  currentUser = null;

  async componentDidMount() {
    const chatManager = new Chatkit.ChatManager({
      instanceLocator,
      userId: 'janedoe',
      tokenProvider: new Chatkit.TokenProvider({
        url: testToken,
      }),
    });

    this.currentUser = await chatManager.connect();
    this.currentUser.subscribeToRoom({
      roomId,
      hooks: {
        onNewMessage: this.onNewMessage,
      },
    });
  }

  onNewMessage = (message) => {
    this.setState({
      messages: [...this.state.messages, message],
    });
  }

  sendMessage = (text) => {
    this.currentUser.sendMessage({
      text,
      roomId,
    });
  }

  render() {
    return (
      <Page renderToolbar={this.renderToolbar}>
        <MessageList
          roomId={this.state.roomId}
          messages={this.state.messages}
        />
        <SendMessageForm sendMessage={this.sendMessage} />
      </Page>
    );
  }
}

export default Chat;
