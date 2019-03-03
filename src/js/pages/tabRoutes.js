
import React from 'react';

import Chat from './Chat';
import Settings from './Settings';
import Map from './Map';

const withTabProps = (InputComponent, key, activeIndex, tabbar) => (
  <InputComponent
    active={activeIndex === key}
    key={key}
    tabbar={tabbar}
  />
);

const tabRoutes = [
  {
    component: Map,
    title: 'Map',
    icon: 'md-map',
  },
  {
    component: Chat,
    title: 'Chat',
    icon: 'md-info',
  },
  {
    component: Settings,
    title: 'Settings',
    icon: 'md-settings',
  },
];

export {
  tabRoutes,
  withTabProps,
};
