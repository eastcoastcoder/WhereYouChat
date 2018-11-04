import React, { Component } from 'react';
import { Page, List, ListItem } from 'react-onsenui';

import Header from '../components/Header';

class Settings extends Component {
  state = {
    listViewData: [
      {
        key: 'onDataClear', displayItems: ['Clear Data'], type: 'alert',
      },
    ],
  };

  renderToolbar = () => <Header title="Settings" />;

  onDataClear = () => {
    // TODO: Call Alert Prompt
    localStorage.removeItem('guid');
    localStorage.removeItem('nickname');
    localStorage.removeItem('bitmojiId');
    window.location.reload();
  }

  _renderRow = row => (
    <ListItem key={row.key} tappable onClick={this[row.key]}>
      <div className="center">
        {row.displayItems}
      </div>
    </ListItem>)

  render() {
    return (
      <Page renderToolbar={this.renderToolbar}>
        <List
          dataSource={this.state.listViewData}
          renderRow={this._renderRow}
        />
      </Page>
    );
  }
}

export default Settings;
