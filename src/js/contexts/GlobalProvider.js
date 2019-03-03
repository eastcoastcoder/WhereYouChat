import React, { Component } from 'react';
import Chatkit from '@pusher/chatkit';

import GlobalContext from './GlobalContext';

const testToken = 'https://us1.pusherplatform.io/services/chatkit_token_provider/v1/a8e4bc30-e708-47f9-adc9-da1adc1fc273/token';
const instanceLocator = 'v1:us1:a8e4bc30-e708-47f9-adc9-da1adc1fc273';
const username = 'guest';

export default class GlobalProvider extends Component {
  state = {
    loading: true,
    joinedRooms: [],
    joinableRooms: [],
    currentRoom: -1,
    targetRoomName: '',
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
    for (const { id } of joinedRooms) {
      await this.currentUser.leaveRoom({ roomId: id });
    }
    const joinableRooms = await this.currentUser.getJoinableRooms();
    this.setState(
      {
        loading: false,
        joinedRooms,
        joinableRooms,
        currentRoom: joinedRooms.length ? joinedRooms[0].id : joinableRooms[0].id,
      },
      async () => {
        await this.subscribeToRoom();
      },
    );
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevState.targetRoomName !== this.state.targetRoomName) {
      await this.onRoomSwitch();
    }
  }

  onRoomSwitch = async () => {
    const { joinableRooms, joinedRooms } = this.state;
    const allRooms = joinableRooms.concat(joinedRooms);
    this.setState({
      messages: [],
      currentRoom: (allRooms.find(e => e.name.includes(this.state.targetRoomName))).id,
    }, async () => {
      await this.subscribeToRoom();
    });
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
      const joinableRooms = await this.currentUser.getJoinableRooms();
      this.setState({
        joinableRooms,
        joinedRooms: this.currentUser.rooms,
      });
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
      roomId: this.state.currentRoom,
    });
  }

  render() {
    return (
      <GlobalContext.Provider value={{
        ...this.state,
        updateState: (prop, value) => this.setState({ [prop]: value }),
        onNewMessage: this.onNewMessage,
        sendMessage: this.sendMessage,
      }}
      >
        {this.props.children}
      </GlobalContext.Provider>
    );
  }
}
