import React, { useState } from 'react';
import { Page, List, ListItem } from 'react-onsenui';

import Header from '../components/Header';

const Settings = () => {
  const [listViewData] = useState([{
    key: 'onDataClear',
    callback: () => onDataClear(),
    displayItems: ['Clear Data'],
    type: 'alert'
  }]);

  const renderToolbar = () => <Header title="Settings" />

  const onDataClear = () => {
    // TODO: Call Alert Prompt
    // localStorage.removeItem('guid');
    localStorage.removeItem('nickname');
    localStorage.removeItem('bitmojiId');
    window.location.reload();
  }

  const _renderRow = row => (
    <ListItem key={row.key} tappable onClick={row.callback}>
      <div className="center">
        {row.displayItems}
      </div>
    </ListItem>)

  return (
    <Page renderToolbar={renderToolbar}>
      <List
        dataSource={listViewData}
        renderRow={_renderRow}
      />
    </Page>
  );
}

export default Settings;
