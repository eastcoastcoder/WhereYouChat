import React, { Component } from 'react';
import ons from 'onsenui';
import { Page } from 'react-onsenui';
import { Map, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import libmoji from 'libmoji';
import { geolocated } from 'react-geolocated';

import dummyData from '../../resources/dummyData';
import Header from '../components/Header';

const HEADER_HEIGHT = 44;

class MapPage extends Component {
  renderToolbar = () => <Header title="Map" />;

  state = {
    zoom: 15,
    loaded: false,
    chatRoomID: -1,
    myGeoJSON: {},
    bitmojiIcon: {},
    userBitmojiID: '128256895_1-s1',
    height: 0,
    width: 0,
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
    this.updateDimensions();
    window.addEventListener('resize', this.updateDimensions);
    this.getCurrentBitmoji();
    await this.getUsersLocations();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  getUsersLocations = async () => {
    this.setState({ loaded: false });
    // Do any requests here, use dummyData for now
    this.setState({ loaded: true, myGeoJSON: dummyData });
  }

  onEachFeature = (feature, layer) => {
    if (feature.properties && feature.properties.Notes) {
      let myPopup = '';
      myPopup += feature.properties.CityState ? `City: ${feature.properties.CityState}<br />` : '';
      myPopup += feature.properties.Country ? `Country: ${feature.properties.Country}<br />` : '';
      layer.bindPopup(myPopup);
    }
  }

  render() {
    const { loaded, myGeoJSON, zoom, height, width, bitmojiIcon } = this.state;
    const { isGeolocationAvailable, isGeolocationEnabled, coords } = this.props;
    return (
      <Page renderToolbar={this.renderToolbar}>
        {!loaded
        ? 'Loading...'
        : !isGeolocationAvailable || !isGeolocationEnabled
          ? <div>Problem obtaining GPS coordinates</div>
          : !coords
            ? 'Loading...'
            : (
              <Map
                center={[coords.latitude, coords.longitude]}
                zoom={zoom}
                style={{ height, width }}
              >
                <TileLayer url="https://api.mapbox.com/styles/v1/nkmap/cjftto4dl8hq32rqegicxuwjz/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibmttYXAiLCJhIjoiY2lwN2VqdDh2MDEzbXN5bm9hODJzZ2NlZSJ9.aVnii-A7yCa632_COjFDMQ" />
                <Marker key="myPosition" position={[coords.latitude, coords.longitude]} icon={bitmojiIcon} >
                  <Popup offset={[0, -50]}>
                    <span>
                        You Are Here
                    </span>
                    <center>
                      <button onClick={async () => {
                        const userBitmojiID = await ons.notification.prompt('Please enter your bitmoji ID<br />EX: 316830037_35-s5');
                        this.setState({ userBitmojiID }, () => this.getCurrentBitmoji());
                      }}
                      >CHANGE BITMOJI
                      </button>
                    </center>
                  </Popup>
                </Marker>
                <GeoJSON key="my-geojson" data={myGeoJSON} onEachFeature={this.onEachFeature} />
                {/* {geoclusterCoords.map((feature, index) => {
                  const chatRoomID = String(index + 1).padStart(3, 0);
                  return (
                    <Circle popup="test" center={lngLatToLatLng(feature.centroid)} radius={500000} >
                      <Popup>
                        <span>
                        Room #{chatRoomID} <br />
                        </span>
                        <center>
                          <button onClick={() => this.setState({ chatRoomID })}>ENTER THIS ROOM</button>
                        </center>
                      </Popup>
                    </Circle>);
                })} */}
              </Map>)}
      </Page>
    );
  }
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
