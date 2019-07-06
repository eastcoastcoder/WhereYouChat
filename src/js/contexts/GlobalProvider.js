import React, { useState } from 'react';
import { ChatManager, TokenProvider } from '@pusher/chatkit-client';

import GlobalContext from './GlobalContext';
import useEffectAsync from '../util/useEffectAsync';

const testToken = 'https://us1.pusherplatform.io/services/chatkit_token_provider/v1/a8e4bc30-e708-47f9-adc9-da1adc1fc273/token';
const instanceLocator = 'v1:us1:a8e4bc30-e708-47f9-adc9-da1adc1fc273';
const username = 'guest';

const GlobalProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [joinableRooms, setJoinableRooms] = useState([]);
  const [roomId, setRoomId] = useState(-1);
  const [targetRoomName, setTargetRoomName] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState({});

  // async componentDidMount
  useEffectAsync(async () => {
    const chatManager = new ChatManager({
      instanceLocator,
      userId: username,
      tokenProvider: new TokenProvider({
        url: testToken,
      }),
    });
    const currentUser = await chatManager.connect();
    setUser(currentUser);
    for (const { id } of currentUser.rooms) {
      await currentUser.leaveRoom({ roomId: id });
    }
    const newJoinableRooms = await currentUser.getJoinableRooms();
    const currentRoom = currentUser.rooms.length ? currentUser.rooms[0].id : newJoinableRooms[0].id;
    await subscribeToRoom(currentUser, currentRoom);
    setRoomId(currentRoom);
    setLoading(false);
  }, []);

  // async componentDidUpdate
  useEffectAsync(async () => {
    if (!Object.keys(user).length || targetRoomName === '') {
      return () => {};
    }
    const allRooms = joinableRooms.concat(joinedRooms);
    setMessages([]);
    const currentRoomId = (allRooms.find(e => e.name.includes(targetRoomName))).id;
    await subscribeToRoom(user, currentRoomId);
    setRoomId(currentRoomId);
    setLoading(false);
  }, [user, targetRoomName]);


  const subscribeToRoom = async (currentUser, currentRoomId) => {
    console.log(`Changing to room: ${currentRoomId}`);
    try {
      await currentUser.subscribeToRoomMultipart({
        roomId: currentRoomId,
        hooks: {
          onMessage,
        },
        messageLimit: 100,
      });
      setJoinableRooms(await currentUser.getJoinableRooms());
      setJoinedRooms(currentUser.rooms);
    } catch (err) {
      console.log('error on subscribing to room: ', err);
    }
  };

  const onMessage = (message) => {
    setMessages(prevMessages => [
      ...prevMessages,
      message,
    ]);
  };

  const sendMessage = (text) => {
    user.sendSimpleMessage({
      roomId,
      text,
    });
  };

  return (
    <GlobalContext.Provider value={{
        loading,
        // joinedRooms,
        // joinableRooms,
        // roomId,
        // targetRoomName,
        messages,
        setTargetRoomName,
        sendMessage,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
