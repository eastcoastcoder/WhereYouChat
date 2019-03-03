import React from 'react';
import ReactDOM from 'react-dom';
import { setConfig } from 'react-hot-loader';
import { platform } from 'onsenui';

import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';


setConfig({
  // pureSFC: true
  ignoreSFC: true, // RHL will be __completely__ disabled for SFC
  pureRender: true, // RHL will not change render method
});

const render = () => {
  ReactDOM.render(<App />, document.getElementById('root'));
  if (platform.isIPhoneX()) {
    document.documentElement.setAttribute('onsflag-iphonex-portrait', '');
    document.documentElement.setAttribute('onsflag-iphonex-landscape', '');
  }
};

registerServiceWorker();

render();
