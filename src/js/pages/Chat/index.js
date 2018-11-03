import React, { Component } from 'react';
import { Page } from 'react-onsenui';
import Chatkit from '@pusher/chatkit';

import Header from '../../components/Header';
import MessageList from './MessageList';
import SendMessageForm from './SendMessageForm';
import withGlobalState from '../../contexts/withGlobalState';

const testToken = 'https://us1.pusherplatform.io/services/chatkit_token_provider/v1/dfaf1e22-2d33-45c9-b4f8-31f634621d24/token';
const instanceLocator = 'v1:us1:dfaf1e22-2d33-45c9-b4f8-31f634621d24';
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
      userId: username,
      tokenProvider: new Chatkit.TokenProvider({
        url: testToken,
      }),
    });

    this.currentUser = await chatManager.connect();
    console.log(await this.currentUser.getJoinableRooms());
    await this.subscribeToRoom();
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.currentRoom !== this.props.currentRoom) {
      await this.subscribeToRoom();
    }
  }

  subscribeToRoom = async () => {
    console.log(`Changing to room: ${this.props.currentRoom}`);
    try {
      const thing = await this.currentUser.subscribeToRoom({
        roomId: this.props.currentRoom,
        hooks: {
          onNewMessage: this.onNewMessage,
        },
      });
      console.log(thing);
    } catch (err) {
      console.log('error on subscribing to room: ', err);
    }
  }

  onNewMessage = (message) => {
    this.setState({
      messages: [...this.state.messages, message],
    });
  }

  sendMessage = (text) => {
    this.currentUser.sendMessage({
      text,
      roomId: this.props.currentRoom,
    });
  }

  render() {
    return (
      <Page renderToolbar={this.renderToolbar}>
        <MessageList
          roomId={this.props.currentRoom}
          messages={this.state.messages}
        />
        <SendMessageForm sendMessage={this.sendMessage} />
      </Page>
    );
  }
}

export default withGlobalState(Chat);
