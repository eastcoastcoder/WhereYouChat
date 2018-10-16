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

import dummyData from '../../resources/dummyData';
import Header from '../components/Header';

const NEAR_CDALE = [-89.2043, 37.7220];
const HEADER_HEIGHT = 44;
const DEFAULT_BITMOJI = '128256895_1-s1';
const BITMOJI_STARTID = 270452360;
const validRandomBitmojiIdArr = [];
let index = 0;

class MapPage extends Component {
  renderToolbar = () => <Header title="Map" />;

  state = {
    zoom: 15,
    loaded: false,
    bitmojiIcon: {},
    userBitmojiID: DEFAULT_BITMOJI,
    userNickname: '',
    height: 0,
    width: 0,
    data: dummyData,
    circleClusters: [],
  }

  getCurrentBitmoji = () => {
    const standingComicId = '10220709';
    const transparent = Number(true);
    const scale = 1;
    this.setState({
      bitmojiIcon: new L.Icon({
        iconUrl: libmoji.buildRenderUrl(standingComicId, this.state.userBitmojiID, transparent, scale),
        iconSize: [95, 95],
        iconAnchor: [50, 75],
      }),
    });
  }

  updateDimensions = () => {
    this.setState({ width: window.innerWidth, height: window.innerHeight - HEADER_HEIGHT });
  }

  async componentDidMount() {
    await this.populateRandomBitmoji();
    this.drawClusters();
    this.updateDimensions();
    window.addEventListener('resize', this.updateDimensions);
    this.getCurrentBitmoji();
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
    this.setState({ userNickname });
  }

  changeBitmoji = async () => {
    const userBitmojiID = await ons.notification.prompt('Please enter your BitmojiId<br />EX: 316830037_35-s5') || DEFAULT_BITMOJI;
    this.setState({ userBitmojiID }, () => this.getCurrentBitmoji());
  }

  onEachCluster = (feature, layer, idx) => {
    const { targetRadius, features, ptsWithin } = this.state.clusteredByGroup[idx];
    const myPopup = `
      <center>
        Room #${idx}<br />
        Radius: ${(targetRadius / 1000).toFixed(2)} Km<br />
        ${features.length} Users Within This Area<br />
        <button type="button"${ptsWithin ? `onclick="joinRoom(${idx})">JOIN THIS ROOM` : 'disabled>YOU ARE OUT OF RANGE'}</button>
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

function onEachFeature(feature, layer) {
  if (feature.properties && feature.properties.Notes) {
    let myPopup = '<center>';
    myPopup += feature.properties.CityState ? `City: ${feature.properties.CityState}<br />` : '';
    myPopup += feature.properties.Country ? `Country: ${feature.properties.Country}<br />` : '';
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
})(MapPage);
