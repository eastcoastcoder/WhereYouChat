import React, { Component } from 'react';
import { Page } from 'react-onsenui';
import { Map, TileLayer, GeoJSON, Marker, Circle, Popup } from 'react-leaflet';
import toGeoJSON from 'togeojson';
import L from 'leaflet';
import libmoji from 'libmoji';
import { geolocated } from 'react-geolocated';
import geocluster from 'geocluster';
import Header from '../components/Header';

const HEADER_HEIGHT = 44;

class MapPage extends Component {
  renderToolbar = () => <Header title="Map" />;

  state = {
    zoom: 15,
    loaded: false,
    myGeoJSON: {},
    bitmojiIcon: {},
    height: 0,
    width: 0,
  }

  getCurrentBitmoji = () => {
    const standingComicId = '10220709';
    const myAvatarId = '128256895_1-s1';
    const transparent = Number(true);
    const scale = 1;
    this.setState({
      bitmojiIcon: new L.Icon({
        iconUrl: libmoji.buildRenderUrl(standingComicId, myAvatarId, transparent, scale),
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
    await this.getKmlToGeoJSON();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  getKmlToGeoJSON = async () => {
    this.setState({ loaded: false });
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const resourceUrl = 'https://batchgeo.com/map/kml/ethanx94';
    const response = await fetch(`${proxyUrl}${resourceUrl}`, {
      method: 'GET',
    });
    const text = await response.text();
    const myKml = (new window.DOMParser()).parseFromString(text, 'text/xml');
    const myGeoJSON = toGeoJSON.kml(myKml);
    const geoclusterCoords = geocluster(myGeoJSON.features.filter(feature => feature.properties.Country === 'USA').map(feature => feature.geometry.coordinates), 0.75);
    this.setState({ loaded: true, myGeoJSON, geoclusterCoords });
  }

  onEachFeature = (feature, layer) => {
    if (feature.properties && feature.properties.Notes) {
      let myPopup = '';
      myPopup += feature.properties.City ? `City: ${feature.properties.City}<br />` : '';
      myPopup += feature.properties.Month ? `Month: ${feature.properties.Month}<br />` : '';
      myPopup += feature.properties.Year ? `Year: ${feature.properties.Year}<br />` : '';
      myPopup += feature.properties.Country ? `Country: ${feature.properties.Country}<br />` : '';
      myPopup += feature.properties.Notes ? `Notes: ${feature.properties.Notes}` : '';
      layer.bindPopup(myPopup);
    }
  }

  render() {
    const { loaded, myGeoJSON, geoclusterCoords, zoom, height, width, bitmojiIcon } = this.state;
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
                <Marker key="myPosition" position={[coords.latitude, coords.longitude]} icon={bitmojiIcon} />
                <GeoJSON key="my-geojson" data={myGeoJSON} onEachFeature={this.onEachFeature} />
                {/* {myGeoJSON.features.map(feature => <Polyline positions={[[feature.geometry.coordinates[1], feature.geometry.coordinates[0]], [coords.latitude, coords.longitude]]} />)}) */}
                {/* {myGeoJSON.features.filter(feature => feature.properties.Year === '2018').map(feature => <Circle center={lngLatToLatLng(feature.geometry.coordinates)} radius={5000} />)} */}
                {geoclusterCoords.map((feature, index) => (
                  <Circle popup="test" center={lngLatToLatLng(feature.centroid)} radius={500000} >
                    <Popup>
                      <span>
                        Room #{String(index + 1).padStart(2, 0)} <br />
                      </span>
                    </Popup>
                  </Circle>))}
                {/* <Polygon positions={myGeoJSON.features.filter(feature => feature.properties.Year === '2015').map(feature => [feature.geometry.coordinates[1], feature.geometry.coordinates[0]])} color="red" /> */}
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
