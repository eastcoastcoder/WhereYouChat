import React, { Component, Fragment } from 'react';
import { Page } from 'react-onsenui';
import SendBird from 'sendbird';

import Header from '../../components/Header';
import MessageList from './MessageList';
import SendMessageForm from './SendMessageForm';

class Chat extends Component {
  renderToolbar = () => <Header title="Chat" />;

  state = {
    messages: [],
    userId: 'ethanx94',
    nickname: 'ethanx94',
    accessToken: '5b8c451df7a918e150f4b30b5aeb720c26082d0a',
    error: '',
  };

  async componentDidMount() {
    // Break this out of didMount, set state properly later
    const { userId, nickname, accessToken } = this.state;
    const chatManager = new SendBird({
      appId: '0266A734-8FC6-4D4F-8C71-F0358DC2B0C0',
    });
    const channelHandler = new chatManager.ChannelHandler();
    // Not working
    channelHandler.onMessageReceived = (channel, message) => {
      console.log('RECIEVED');
      console.log(channel, message);
      this.onNewMessage(message);
    };
    chatManager.addChannelHandler('GLOBAL_HANDLER', channelHandler);
    chatManager.connect(userId, accessToken, (user, error) => {
      if (error) {
        return this.setState({ error });
      }
      chatManager.OpenChannel.getChannel('sendbird_open_channel_43779_1b506a183920eace7f5a6120427044a648f5283c', (channel, error) => {
        if (error) {
          return this.setState({ error });
        }

        channel.enter((response, error) =>
          !error
            ? this.setState({ channel }, () => this.getMessageList(channel))
            : this.setState({ error }));
      });
    });
  }

  getMessageList = (channel) => {
    const messageListQuery = channel.createPreviousMessageListQuery();
    messageListQuery.load(
      30, true,
      (messages, error) => !error
        ? this.setState({ messages })
        : this.setState({ error }),
    );
  }

  onNewMessage = (message) => {
    this.setState({
      messages: [...this.state.messages, message],
    });
  }

  sendMessage = (text) => {
    const { channel } = this.state;
    channel.sendUserMessage(
      text,
      (message, error) =>
        !error
          ? console.log(`Message submitted: ${JSON.stringify(message.message)}`)
          : this.setState({ error }),
    );
  }

  render() {
    const { error } = this.state;
    return (
      <Page renderToolbar={this.renderToolbar}>
        {!error
        ? (
          <Fragment>
            <MessageList
              roomId={this.state.roomId}
              messages={this.state.messages}
            />
            <SendMessageForm sendMessage={this.sendMessage} />
          </Fragment>)
        : <div>{error}</div>
      }
      </Page>
    );
  }
}

export default Chat;
