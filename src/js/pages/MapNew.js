import React, { useState, useContext, useEffect } from 'react';
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
import useEffectAsync from '../util/useEffectAsync';
import GlobalContext from '../contexts/GlobalContext';
import dummyData from '../../data/locations.json';

const isDev = process.env.NODE_ENV === 'development';
const NEAR_CDALE = [-89.2043, 37.7220];
const HEADER_HEIGHT = 44;
const DEFAULT_BITMOJI = '128256895_1-s1';
const BITMOJI_STARTID = 270452360;
const validRandomBitmojiIdArr = [];
let index = 0;

const EXTERNAL_FUNCS = ['joinRoom'];
const { REACT_APP_GIST_TOKEN } = process.env;

const MapPage = ({ isGeolocationAvailable, isGeolocationEnabled, coords }) => {
  const renderToolbar = () => <Header title="Map" />;

  const { setTargetRoomName } = useContext(GlobalContext);
  const [zoom, setZoom] = useState(15);
  const [componentLoading, setLoading] = useState(false);
  const [bitmojiIcon, setBitmojiIcon] = useState({});
  const [userBitmojiId, setUserBitmojiId] = useState(DEFAULT_BITMOJI);
  const [userNickname, setUserNickname] = useState('');
  const [userGuid, setUserGuid] = useState('');
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [data, setData] = useState([]);
  const [userObject, setUserObject] = useState({});
  const [userObjectIndex, setUserObjectIndex] = useState(-1);
  const [clusteredByGroup, setClusteredByGroup] = useState([]);
  const [circleClusters, setCircleClusters] = useState([]);

  useEffectAsync(async () => {
    let userGuidResult = localStorage.getItem('guid') || userGuid;
    const response = await fetch('https://api.github.com/gists/cf064f2d044da0e6f0824ae54122aa18');
    let userObjectResult = {};
    let dataResult = { features: [] };
    if (isDev || response.status === 200) {
      if (isDev) {
        dataResult = dummyData;
      } else if (response.status === 200) {
        const { files } = await response.json();
        dataResult = JSON.parse(files['locations.json'].content);
      }
      const userObjectIndexResult = dataResult.features.findIndex(d => d.properties.guid === userGuidResult) || userObjectResult;
      // Remove yourself
      if (userObjectIndexResult) dataResult.features.splice(userObjectIndexResult, 1);
      userObjectResult = userObjectIndexResult > -1 ? dataResult.features[userObjectIndexResult] : {};
      setData(dataResult);
      setUserObject(userObjectResult);
      setUserObjectIndex(userObjectIndexResult);
    } else {
      console.log('err');
    }
    const userBitmojiIdResult = localStorage.getItem('bitmojiId') || userBitmojiId;
    const userNicknameResult = localStorage.getItem('nickname') || userNickname;
    // "First Run"
    if (!userGuidResult) {
      userGuidResult = generateFakeGuid();
      localStorage.setItem('guid', userGuidResult);
      if (!Object.keys(userObjectResult).length) {
        await patchNewUser(userGuidResult);
      }
    }
    // TODO: Coordinate update checking for existing users
    setUserGuid(userGuidResult);
    setUserBitmojiId(userBitmojiIdResult);
    setUserNickname(userNicknameResult);
    // TODO: ensure after state change or pass args into functions
    await populateRandomBitmoji(dataResult);
    drawClusters(dataResult);
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('message', msgHandler);
    getCurrentBitmoji(userBitmojiIdResult);
  }, []);

  const getCurrentBitmoji = (userBitmojiIdLocal) => {
    const standingComicId = '10220709';
    const transparent = Number(true);
    const scale = 1;
    const bitmojiIconLocal = new L.Icon({
      iconUrl: libmoji.buildRenderUrl(standingComicId, userBitmojiIdLocal, transparent, scale),
      iconSize: [95, 95],
      iconAnchor: [50, 75],
    });
    setBitmojiIcon(bitmojiIconLocal);
  };

  const updateDimensions = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight - HEADER_HEIGHT);
  };

  const patchNewUser = async (guid) => {
    const dataCopy = { ...data };
    const longitude = coords ? coords.longitude : NEAR_CDALE[0];
    const latitude = coords ? coords.latitude : NEAR_CDALE[1];
    // TODO: Add Google geocoder as CityState prop on properties
    const userObjectLocal = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      properties: {
        guid,
        CityState: '',
      },
    };
    dataCopy.features.push(userObjectLocal);
    const patchBody = {
      files: {
        'locations.json': {
          content: JSON.stringify(dataCopy, null, 2),
        },
      },
    };
    const patchResponse = await fetch(`https://api.github.com/gists/cf064f2d044da0e6f0824ae54122aa18?access_token=${REACT_APP_GIST_TOKEN}`, {
      method: 'PATCH',
      body: JSON.stringify(patchBody),
    });
    if (patchResponse.status === 200) {
      // Don't add youself to the map with the other GeoJSON
      // this.setState({ data });
    } else {
      console.log('err');
    }
  };

  // TODO: Don't execute on first run
  useEffectAsync(async () => {
    if (componentLoading) return () => {};
    // await patchExistingUser();
  }, [userGuid, coords]);

  const patchExistingUser = async () => {
    const dataCopy = { ...data };
    const userObjectCopy = { ...userObject };
    const { longitude, latitude } = coords;
    if (!userObjectCopy) return;
    // If coords are equal to existing coords, bail out
    if (userObjectCopy.geometry.coordinates[0] === longitude ||
       userObjectCopy.geometry.coordinates[1] === latitude) return;
    // TODO: Add Google geocoder as CityState prop on properties
    const modifiedUserObject = {
      ...userObject,
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      CityState: '',
    };
    dataCopy.features[userObjectIndex] = modifiedUserObject;
    const patchBody = {
      files: {
        'locations.json': {
          content: JSON.stringify(dataCopy, null, 2),
        },
      },
    };
    const patchResponse = await fetch(`https://api.github.com/gists/cf064f2d044da0e6f0824ae54122aa18?access_token=${REACT_APP_GIST_TOKEN}`, {
      method: 'PATCH',
      body: JSON.stringify(patchBody),
    });
    if (patchResponse.status === 200) {
      setData(dataCopy);
    } else {
      console.log('err');
    }
  };

  // TODO: Take out class bindings
  const msgHandler = (message) => {
    let args = [];
    let func;
    let remainingStr;
    if (typeof message.data === 'string') [func, remainingStr] = message.data.split('(');
    if (remainingStr) args = remainingStr.slice(0, -1).split(',');
    if (EXTERNAL_FUNCS.includes(func)) {
      [func](...args);
    }
  };

  const joinRoom = (roomNameNum) => {
    console.log(`JOINING ${roomNameNum}`);
    setTargetRoomName(`room${roomNameNum}`);
  };

  const drawClusters = (dataLocal) => {
    const circleClustersLocal = [];
    const longitude = coords ? coords.longitude : NEAR_CDALE[0];
    const latitude = coords ? coords.latitude : NEAR_CDALE[1];
    const clusteredByGroupResult = calcuateClusteredByGroup(dataLocal);
    for (let i = 0; i < clusteredByGroupResult.length; i++) {
      const myBboxPolygon = bboxPolygon(bbox(clusteredByGroupResult[i]));
      const midpoint = center(myBboxPolygon).geometry.coordinates;
      const minRadius = length(lineString([midpoint, myBboxPolygon.geometry.coordinates[0][0]]), { units: 'meters' });
      let potentialRadius;
      switch (clusteredByGroupResult[i].features.length) {
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

      clusteredByGroupResult[i].ptsWithin = booleanPointInPolygon(curLocation, curCircle);
      clusteredByGroupResult[i].targetRadius = targetRadius;
      clusteredByGroupResult[i].midpoint = midpoint;
      circleClustersLocal.push(curCircle);
    }
    setClusteredByGroup(clusteredByGroupResult);
    setCircleClusters(circleClustersLocal);
  };

  const populateRandomBitmoji = async (dataLocal) => {
    const clustered = clustersKmeans(dataLocal, { numberOfClusters: Math.floor(dataLocal.features.length / 4) });
    setData(clustered);
    while (validRandomBitmojiIdArr.length < clustered.features.length) {
      const randomNum = Math.floor(Math.random() * 1000) + 1;
      const bitmojiId = (BITMOJI_STARTID - randomNum);
      const url = 'https://images.bitmoji.com/render/panel/10220709-' + bitmojiId + '_2-s1-v1.png?transparent=1';
      const response = await fetch(url);
      if (response.status === 200) {
        validRandomBitmojiIdArr.push(bitmojiId);
      } else {
        await populateRandomBitmoji(clustered);
      }
    }
    setLoading(false);
  };

  useEffect(() => () => window.removeEventListener('resize', updateDimensions), []);

  const changeNickname = async () => {
    const userNicknameResult = await ons.notification.prompt('Please enter your Nickname<br />');
    localStorage.setItem('nickname', userNicknameResult);
    setUserNickname(userNicknameResult);
  };

  // TODO: Send out PATCH request to userObject with property of bitmojiId
  // Should take precedence over in populateRandomBitmoji method
  const changeBitmoji = async () => {
    const userBitmojiIdResult = await ons.notification.prompt('Please enter your BitmojiId<br />EX: 316830037_35-s5') || DEFAULT_BITMOJI;
    localStorage.setItem('bitmojiId', userBitmojiIdResult);
    setUserBitmojiId(userBitmojiIdResult);
    getCurrentBitmoji(userBitmojiIdResult);
  };

  const onEachCluster = (feature, layer, idx) => {
    const { targetRadius, features, ptsWithin } = clusteredByGroup[idx];
    const myPopup = `
      <center>
        Room #${idx}<br />
        Radius: ${(targetRadius / 1000).toFixed(2)} Km<br />
        ${features.length} Users Within This Area<br />
        <ons-button class="button" style="margin: 6px;" ${ptsWithin
    ? `onclick="window.postMessage('joinRoom(${idx})', '*')">JOIN THIS ROOM`
    : 'disabled>YOU ARE OUT OF RANGE'}</ons-button>
      </center>
    `;
    layer.bindPopup(myPopup);
  };

  return (
    <Page renderToolbar={renderToolbar}>
      {componentLoading
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
                {/* Load Yourself */}
                <Marker key="myPosition" position={[coords.latitude, coords.longitude]} icon={bitmojiIcon} >
                  <Popup offset={[0, -50]}>
                    <center>
                      <h2>{userNickname ? `${userNickname} Is Here` : 'You Are Here'}</h2>
                      <Button
                        style={{ margin: '6px' }}
                        onClick={async () => changeNickname()}
                      >Change Nickname
                      </Button>
                      <Button
                        style={{ margin: '6px' }}
                        onClick={async () => changeBitmoji()}
                      >Change Bitmoji
                      </Button>
                    </center>
                  </Popup>
                </Marker>
                {/* Load Others */}
                <GeoJSON
                  key="others-geojson"
                  data={data}
                  onEachFeature={onEachFeature}
                  pointToLayer={pointToLayer}
                />
                {/* Load Circle Clusters */}
                {circleClusters.length ? circleClusters.map((circleCluster, idx) => <GeoJSON key={'circle-cluster-geojson-' + idx} data={circleCluster} onEachFeature={(feature, layer) => onEachCluster(feature, layer, idx)} />) : null}
              </Map>)}
    </Page>
  );
};

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

function calcuateClusteredByGroup(dataLocal) {
  const clusteredByGroup = [];
  for (const cluster of dataLocal.features) {
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
