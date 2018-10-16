import React from 'react';
import { Page, Tabbar, Tab } from 'react-onsenui';

import Chat from './Chat';
import Settings from './Settings';
import Map from './Map';

class Main extends React.Component {
  renderTabs = () => {
    const sections = [
      {
        content: <Map key="Map" navigator={this.props.navigator} />,
        title: 'Map',
        icon: 'md-map',
      },
      {
        content: <Chat key="Chat" navigator={this.props.navigator} />,
        title: 'Chat',
        icon: 'md-info',
      },
      {
        content: <Settings key="Settings" navigator={this.props.navigator} />,
        title: 'Settings',
        icon: 'md-settings',
      },
    ];

    return sections.map((section) => ({
      content: section.content,
      tab: <Tab key={section.title} label={section.title} icon={section.icon} />,
    }));
  }

  render() {
    return (
      <Page>
        <Tabbar
          initialIndex={0}
          renderTabs={this.renderTabs}
        />
      </Page>
    );
  }
}

export default Main;
