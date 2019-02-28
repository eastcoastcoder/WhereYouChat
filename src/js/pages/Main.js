import React from 'react';
import { Page, Tabbar, Tab } from 'react-onsenui';

import Chat from './Chat';
import Settings from './Settings';
import Map from './Map';

const renderTabs = (navigator) => {
  const sections = [
    {
      content: <Map key="Map" navigator={navigator} />,
      title: 'Map',
      icon: 'md-map',
    },
    {
      content: <Chat key="Chat" navigator={navigator} />,
      title: 'Chat',
      icon: 'md-info',
    },
    {
      content: <Settings key="Settings" navigator={navigator} />,
      title: 'Settings',
      icon: 'md-settings',
    },
  ];

  return sections.map((section) => ({
    content: section.content,
    tab: <Tab key={section.title} label={section.title} icon={section.icon} />,
  }));
}

const Main = ({ navigator }) => (
  <Page>
    <Tabbar
      initialIndex={0}
      renderTabs={() => renderTabs(navigator)}
    />
  </Page>);

export default Main;
