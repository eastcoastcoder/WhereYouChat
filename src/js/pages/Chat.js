import React, { Component } from 'react';
import { Page } from 'react-onsenui';

import Header from '../components/Header';

class Chat extends Component {
  renderToolbar = () => <Header title="Chat" />;

  render() {
    return (
      <Page renderToolbar={this.renderToolbar}>
        <div>
          Chat goes here...
        </div>
      </Page>
    );
  }
}

export default Chat;
