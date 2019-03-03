import React from 'react';
import { Page, Tabbar, Tab } from 'react-onsenui';
import { tabRoutes, withTabProps } from './tabRoutes';

const Main = () => (
  <Page>
    <Tabbar
      initialIndex={0}
      renderTabs={(activeIndex, tabbar) =>
        tabRoutes.map((tab, idx) => ({
          content: withTabProps(tab.component, idx, activeIndex, tabbar),
          tab: <Tab key={idx} label={tab.title} icon={tab.icon} />,
        }))
      }
    />
  </Page>);

export default Main;
