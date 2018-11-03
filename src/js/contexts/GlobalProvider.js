import React, { Component } from 'react';
import Chatkit from '@pusher/chatkit';

import GlobalContext from './GlobalContext';

const testToken = 'https://us1.pusherplatform.io/services/chatkit_token_provider/v1/a8e4bc30-e708-47f9-adc9-da1adc1fc273/token';
const instanceLocator = 'v1:us1:a8e4bc30-e708-47f9-adc9-da1adc1fc273';
const username = 'guest';

export default class GlobalProvider extends Component {
  state = {
    joinedRooms: [],
    joinableRooms: [],
    currentRoom: -1,
    messages: [],
  }
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
    const joinedRooms = this.currentUser.rooms;
    const joinableRooms = await this.currentUser.getJoinableRooms();
    this.setState(
      {
        joinedRooms,
        joinableRooms,
        currentRoom: joinedRooms.length ? joinedRooms[0].id : joinableRooms[0].id,
      },
      async () => {
        await this.subscribeToRoom();
      },
    );
  }

  subscribeToRoom = async () => {
    console.log(`Changing to room: ${this.state.currentRoom}`);
    try {
      await this.currentUser.subscribeToRoom({
        roomId: this.state.currentRoom,
        hooks: {
          onNewMessage: this.onNewMessage,
        },
      });
    } catch (err) {
      console.log('error on subscribing to room: ', err);
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevState.currentRoom !== this.state.currentRoom) {
      await this.subscribeToRoom();
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
      roomId: this.state.currentRoom,
    });
  }

  updateState = (prop, value) => {
    this.setState({ [prop]: value });
  }

  render() {
    console.log(this.state);
    return (
      <GlobalContext.Provider value={{
        ...this.state,
        updateState: this.updateState,
        onNewMessage: this.onNewMessage,
        sendMessage: this.sendMessage,
      }}
      >
        {this.props.children}
      </GlobalContext.Provider>
    );
  }
}
