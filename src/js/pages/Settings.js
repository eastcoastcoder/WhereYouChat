import React, { Component } from 'react';
import { Page } from 'react-onsenui';

import Header from '../components/Header';

class Settings extends Component {
  renderToolbar = () => <Header title="Settings" />;

  render() {
    return (
      <Page renderToolbar={this.renderToolbar}>
        <div>
          No Settings to configure yet...
        </div>
      </Page>
    );
  }
}

export default Settings;
