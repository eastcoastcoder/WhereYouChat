import React, { Component } from 'react';
import ons from 'onsenui';
import {
  clustersKmeans,
  bbox,
  bboxPolygon,
  center,
  lineString,
  length,
  circle,
  point,
  booleanPointInPolygon,
} from '@turf/turf';
import { Page, Button } from 'react-onsenui';
import { Map, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import libmoji from 'libmoji';
import { geolocated } from 'react-geolocated';

import Header from '../components/Header';
import withGlobalState from '../contexts/withGlobalState';

const NEAR_CDALE = [-89.2043, 37.7220];
const HEADER_HEIGHT = 44;
const DEFAULT_BITMOJI = '128256895_1-s1';
const BITMOJI_STARTID = 270452360;
const validRandomBitmojiIdArr = [];
let index = 0;

const EXTERNAL_FUNCS = ['joinRoom'];
// const { REACT_APP_GIST_TOKEN } = process.env;

class MapPage extends Component {
  renderToolbar = () => <Header title="Map" />;

  state = {
    zoom: 15,
    loaded: false,
    bitmojiIcon: {},
    userBitmojiId: DEFAULT_BITMOJI,
    userNickname: '',
    userGuid: '',
    height: 0,
    width: 0,
    data: [],
    circleClusters: [],
  }

  getCurrentBitmoji = () => {
    const standingComicId = '10220709';
    const transparent = Number(true);
    const scale = 1;
    this.setState({
      bitmojiIcon: new L.Icon({
        iconUrl: libmoji.buildRenderUrl(standingComicId, this.state.userBitmojiId, transparent, scale),
        iconSize: [95, 95],
        iconAnchor: [50, 75],
      }),
    });
  }

  updateDimensions = () => {
    this.setState({ width: window.innerWidth, height: window.innerHeight - HEADER_HEIGHT });
  }

  async componentDidMount() {
    const response = await fetch('https://api.github.com/gists/cf064f2d044da0e6f0824ae54122aa18');
    if (response.status === 200) {
      const { files } = (await response.json());
      const data = JSON.parse(files['locations.json'].content);
      this.setState({ data });
    } else {
      console.log('err');
    }
    let userGuid = localStorage.getItem('guid') || this.state.userGuid;
    const userBitmojiId = localStorage.getItem('bitmojiId') || this.state.userBitmojiId;
    const userNickname = localStorage.getItem('nickname') || this.state.userNickname;
    // "First Run"
    if (!userGuid) {
      userGuid = generateFakeGuid();
      localStorage.setItem('guid', userGuid);
    }
    // const patchResponse = await fetch(`https://api.github.com/gists/cf064f2d044da0e6f0824ae54122aa18?access_token=${REACT_APP_GIST_TOKEN}`);
    // if (patchResponse.status === 200) {
    //   const { files } = (await patchResponse.json());
    //   const data = JSON.parse(files['locations.json'].content);
    //   this.setState({ data });
    // } else {
    //   console.log('err');
    // }
    this.setState({
      userGuid,
      userBitmojiId,
      userNickname,
    }, async () => {
      await this.populateRandomBitmoji();
      this.drawClusters();
      this.updateDimensions();
      window.addEventListener('resize', this.updateDimensions);
      window.addEventListener('message', this.msgHandler);
      this.getCurrentBitmoji();
    });
  }

  msgHandler = (message) => {
    let args = [];
    let func;
    let remainingStr;
    if (typeof message.data === 'string') [func, remainingStr] = message.data.split('(');
    if (remainingStr) args = remainingStr.slice(0, -1).split(',');
    if (EXTERNAL_FUNCS.includes(func)) {
      this[func](...args);
    }
  }

  joinRoom = (roomNameNum) => {
    console.log(`JOINING ${roomNameNum}`);
    this.props.updateState('targetRoomName', `room${roomNameNum}`);
  }

  drawClusters = () => {
    const { data, circleClusters } = this.state;
    const { coords } = this.props;
    const longitude = coords ? coords.longitude : NEAR_CDALE[0];
    const latitude = coords ? coords.latitude : NEAR_CDALE[1];
    const clusteredByGroup = calcuateClusteredByGroup(data);
    for (let i = 0; i < clusteredByGroup.length; i++) {
      const myBboxPolygon = bboxPolygon(bbox(clusteredByGroup[i]));
      const midpoint = center(myBboxPolygon).geometry.coordinates;
      const minRadius = length(lineString([midpoint, myBboxPolygon.geometry.coordinates[0][0]]), { units: 'meters' });
      let potentialRadius;
      switch (clusteredByGroup[i].features.length) {
        case 6:
          potentialRadius = 250000;
          break;
        case 5:
          potentialRadius = 300000;
          break;
        case 4:
          potentialRadius = 350000;
          break;
        case 3:
          potentialRadius = 400000;
          break;
        case 2:
          potentialRadius = 450000;
          break;
        case 1:
          potentialRadius = 500000;
          break;
        default:
          break;
      }
      const targetRadius = (minRadius < potentialRadius) ? potentialRadius : minRadius;

      const curCircle = circle(midpoint, targetRadius, { units: 'meters' });
      const curLocation = point([longitude, latitude]);

      clusteredByGroup[i].ptsWithin = booleanPointInPolygon(curLocation, curCircle);
      clusteredByGroup[i].targetRadius = targetRadius;
      clusteredByGroup[i].midpoint = midpoint;
      circleClusters.push(curCircle);
    }
    this.setState({ clusteredByGroup, circleClusters });
  }

  populateRandomBitmoji = async () => {
    const { data } = this.state;
    const clustered = clustersKmeans(data, { numberOfClusters: data.features.length / 4 });
    this.setState({ data: clustered }, async () => {
      while (validRandomBitmojiIdArr.length < clustered.features.length) {
        const randomNum = Math.floor(Math.random() * 1000) + 1;
        const bitmojiId = (BITMOJI_STARTID - randomNum);
        const url = 'https://images.bitmoji.com/render/panel/10220709-' + bitmojiId + '_2-s1-v1.png?transparent=1';
        const response = await fetch(url);
        if (response.status === 200) {
          validRandomBitmojiIdArr.push(bitmojiId);
        } else {
          await this.populateRandomBitmoji();
        }
      }
      this.setState({ loaded: true });
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  changeNickname = async () => {
    const userNickname = await ons.notification.prompt('Please enter your Nickname<br />');
    localStorage.setItem('nickname', userNickname);
    this.setState({ userNickname });
  }

  changeBitmoji = async () => {
    const userBitmojiId = await ons.notification.prompt('Please enter your BitmojiId<br />EX: 316830037_35-s5') || DEFAULT_BITMOJI;
    localStorage.setItem('bitmojiId', userBitmojiId);
    this.setState({ userBitmojiId }, () => this.getCurrentBitmoji());
  }

  onEachCluster = (feature, layer, idx) => {
    const { targetRadius, features, ptsWithin } = this.state.clusteredByGroup[idx];
    const myPopup = `
      <center>
        Room #${idx}<br />
        Radius: ${(targetRadius / 1000).toFixed(2)} Km<br />
        ${features.length} Users Within This Area<br />
        <ons-button class="button" style="margin: 6px;" ${
          ptsWithin
            ? `onclick="window.postMessage('joinRoom(${idx})', '*')">JOIN THIS ROOM`
            : 'disabled>YOU ARE OUT OF RANGE'
          }</ons-button>
      </center>
    `;
    layer.bindPopup(myPopup);
  }

  render() {
    const { loaded, data, zoom, height, width, bitmojiIcon, circleClusters } = this.state;
    const { isGeolocationAvailable, isGeolocationEnabled, coords } = this.props;
    return (
      <Page renderToolbar={this.renderToolbar}>
        {!loaded
        ? 'Loading...'
        // : !isGeolocationAvailable || !isGeolocationEnabled
          // ? <div>Problem obtaining GPS coordinates</div>
          : !coords
            ? 'Loading...'
            : (
              <Map
                center={[coords.latitude, coords.longitude]}
                zoom={zoom}
                style={{ height, width }}
              >
                <TileLayer url="https://api.mapbox.com/styles/v1/nkmap/cjftto4dl8hq32rqegicxuwjz/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibmttYXAiLCJhIjoiY2lwN2VqdDh2MDEzbXN5bm9hODJzZ2NlZSJ9.aVnii-A7yCa632_COjFDMQ" />
                {/* Load Yourself */}
                <Marker key="myPosition" position={[coords.latitude, coords.longitude]} icon={bitmojiIcon} >
                  <Popup offset={[0, -50]}>
                    <center>
                      <h2>{this.state.userNickname ? `${this.state.userNickname} Is Here` : 'You Are Here'}</h2>
                      <Button
                        style={{ margin: '6px' }}
                        onClick={async () => this.changeNickname()}
                      >Change Nickname
                      </Button>
                      <Button
                        style={{ margin: '6px' }}
                        onClick={async () => this.changeBitmoji()}
                      >Change Bitmoji
                      </Button>
                    </center>
                  </Popup>
                </Marker>
                {/* Load Others */}
                <GeoJSON key="others-geojson" data={data} onEachFeature={onEachFeature} pointToLayer={pointToLayer} />
                {/* Load Circle Clusters */}
                {circleClusters.length ? circleClusters.map((circleCluster, idx) => <GeoJSON key={'circle-cluster-geojson-' + idx} data={circleCluster} onEachFeature={(feature, layer) => this.onEachCluster(feature, layer, idx)} />) : null}
              </Map>)}
      </Page>
    );
  }
}

function generateFakeGuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function onEachFeature(feature, layer) {
  if (feature.properties) {
    let myPopup = '<center>';
    myPopup += feature.properties.CityState ? `City: ${feature.properties.CityState}<br />` : '';
    myPopup += typeof layer.feature.properties.cluster === 'number' ? `Room #${layer.feature.properties.cluster}<br />` : '';
    myPopup += '</center>';
    layer.bindPopup(myPopup);
  }
}

function pointToLayer(_, latlng) {
  return L.marker(latlng, {
    icon: L.icon({
      iconUrl: 'https://images.bitmoji.com/render/panel/10220709-' + validRandomBitmojiIdArr[index++] + '_2-s1-v1.png?transparent=1',
      iconSize: [95, 95],
      iconAnchor: [50, 90],
      popupAnchor: [0, -75],
    }),
  });
}

function calcuateClusteredByGroup(data) {
  const clusteredByGroup = [];
  for (const cluster of data.features) {
    if (!clusteredByGroup[cluster.properties.cluster]) clusteredByGroup[cluster.properties.cluster] = { type: 'FeatureCollection', features: [] };
    clusteredByGroup[cluster.properties.cluster].features.push(cluster);
  }
  return clusteredByGroup;
}

function lngLatToLatLng(arr) {
  return [arr[1], arr[0]];
}

export default geolocated({
  positionOptions: {
    enableHighAccuracy: false,
  },
  userDecisionTimeout: 5000,
})(withGlobalState(MapPage));
