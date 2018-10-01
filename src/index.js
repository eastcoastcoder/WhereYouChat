import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { platform } from 'onsenui';

import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

const render = () => {
  ReactDOM.render(
    <AppContainer>
      <App />
    </AppContainer>,
    document.getElementById('root'),
  );
  if (platform.isIPhoneX()) {
    document.documentElement.setAttribute('onsflag-iphonex-portrait', '');
    document.documentElement.setAttribute('onsflag-iphonex-landscape', '');
  }
};

registerServiceWorker();

render();

if (module.hot) {
  module.hot.accept('./App', () => {
    render();
  });
}
