import React from 'react';
import { Navigator } from 'react-onsenui';
import 'onsenui/css/onsenui.css';
import 'onsenui/css/onsen-css-components.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// import libmoji from 'libmoji';

import Main from './js/pages/Main';
import './css/main.css';
import './css/normalize.min.css';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default class App extends React.Component {
  renderPage = (route, navigator) => {
    const props = route.props || {};
    props.navigator = navigator;
    return React.createElement(route.component, props);
  }

  render() {
    /*
    Bitmoji scratch
    190872076_3-s1
    console.log(libmoji.getAvatarId('https://render.bitstrips.com/v2/cpanel/8968038-190872076_3-s1-v1.png?transparent=1&palette=1'));
    const comicId = libmoji.getComicId(libmoji.randTemplate(libmoji.templates));
    const avatarId = '190872076_3-s1';
    const outfit = libmoji.randOutfit(libmoji.getOutfits(libmoji.randBrand(libmoji.getBrands('male'))));

    // https://images.bitmoji.com/render/panel/10220709-190872076_3-s1-v1.webp?transparent=1
    console.log(libmoji.buildRenderUrl(comicId, avatarId, 1, 2, outfit));
    */
    return (
      <Navigator
        initialRoute={{
          component: Main,
          props: { key: 'main' },
        }}
        renderPage={this.renderPage}
      />
    );
  }
}
