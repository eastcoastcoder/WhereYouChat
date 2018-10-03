import React, { Component } from 'react';
import { Page } from 'react-onsenui';
import { Map, TileLayer, GeoJSON, Marker, Polyline } from 'react-leaflet';
import toGeoJSON from 'togeojson';
import L from 'leaflet';

import Header from '../components/Header';

const bitmojiIcon = new L.Icon({
  iconUrl: 'https://images.bitmoji.com/render/panel/10220709-190872076_3-s1-v1.png?transparent=1',
  iconSize: [95, 95],
  iconAnchor: [50, 75],
});

class MapPage extends Component {
  renderToolbar = () => <Header title="Map" />;

  state = {
    lat: 37.7220,
    lng: -89.2043,
    zoom: 15,
    loaded: false,
    myGeoJSON: {},
    height: 0,
    width: 0,
  }

  updateDimensions = () => {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  }

  async componentDidMount() {
    this.updateDimensions();
    window.addEventListener('resize', this.updateDimensions);
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
    this.setState({ loaded: true, myGeoJSON });
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
    const { loaded, myGeoJSON, lat, lng, zoom, height, width } = this.state;
    return (
      <Page renderToolbar={this.renderToolbar}>
        {!loaded
        ? 'Loading...'
        : (
          <Map
            center={[lat, lng]}
            zoom={zoom}
            style={{ height, width }}
          >
            <TileLayer
              url="https://api.mapbox.com/styles/v1/nkmap/cjftto4dl8hq32rqegicxuwjz/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibmttYXAiLCJhIjoiY2lwN2VqdDh2MDEzbXN5bm9hODJzZ2NlZSJ9.aVnii-A7yCa632_COjFDMQ"
            />
            <Marker key="nearCDale" position={[lat, lng]} icon={bitmojiIcon} />
            <GeoJSON key="my-geojson" data={myGeoJSON} onEachFeature={this.onEachFeature} />
            {myGeoJSON.features.map(feature => <Polyline positions={[[feature.geometry.coordinates[1], feature.geometry.coordinates[0]], [lat, lng]]} />)})
          </Map>)}
      </Page>
    );
  }
}

export default MapPage;
