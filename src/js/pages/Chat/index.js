import React from 'react';
import { Page } from 'react-onsenui';

import Header from '../../components/Header';
import MessageList from './MessageList';
import SendMessageForm from './SendMessageForm';

const Chat = () => (
  <Page renderToolbar={() => <Header title="Chat" />}>
    <MessageList />
    <SendMessageForm />
  </Page>
);

export default Chat;
