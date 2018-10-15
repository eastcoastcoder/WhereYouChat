
const __DEV__ = false;

const osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const snapchat = L.tileLayer('https://api.mapbox.com/styles/v1/nkmap/cjftto4dl8hq32rqegicxuwjz/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibmttYXAiLCJhIjoiY2lwN2VqdDh2MDEzbXN5bm9hODJzZ2NlZSJ9.aVnii-A7yCa632_COjFDMQ', {maxZoom: 18});
const fakeSnapchat = L.tileLayer('https://api.mapbox.com/styles/v1/ethanx94/cjgaaxn871il62sp1e80vkog1/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZXRoYW54OTQiLCJhIjoiY2pnYWF0YWZvMW5neTJ5bXQ3d2VuaDBrcCJ9.jYfc6WsaQ7jMNm0GGr27Zw', {maxZoom: 18});
const osm = L.tileLayer(osmUrl, {maxZoom: 18, attribution: osmAttrib});
const nearCDale = new L.LatLng(37.7220, -89.2043);
const map = new L.Map('map', {center: nearCDale, zoom: 15});
const drawnItems = L.featureGroup().addTo(map);

var bitmojiIcon = L.icon({
  iconUrl: 'https://images.bitmoji.com/render/panel/10220709-128256895_1-s1-v1.png?transparent=1',
  iconSize:     [95, 95],
  iconAnchor:   [50, 90],
  popupAnchor:  [0, -75]
});

const defaultPosition = L.marker(nearCDale, { icon: bitmojiIcon }).addTo(map);

const validRandomBitmojiIdArr = [];

L.control.layers({
  'snapchat': snapchat.addTo(map),
  'fakeSnapchat': fakeSnapchat,
  'osm': osm,
  'google': L.tileLayer('http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
    attribution: 'google'
  })
}, {'drawlayer':drawnItems}, { position: 'topright', collapsed: false }).addTo(map);

jumpToLocation(map);
map.addControl(new L.Control.Draw({
  edit: {
    featureGroup: drawnItems,
    poly : {
      allowIntersection : false
    }
  },
  draw: {
    polygon : {
      allowIntersection: false,
      showArea:true
    }
  }
}));

// Truncate value based on number of decimals
const _round = function(num, len) {
  return Math.round(num*(Math.pow(10, len)))/(Math.pow(10, len));
};
// Helper method to format LatLng object (x.xxxxxx, y.yyyyyy)
const strLatLng = function(latlng) {
  return '('+_round(latlng.lat, 6)+', '+_round(latlng.lng, 6)+')';
};

// Generate popup content based on layer type
// - Returns HTML string, or null if unknown object
const getPopupContent = function(layer) {
  // Marker - add lat/long
  if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
    return strLatLng(layer.getLatLng());
    // Circle - lat/long, radius
  } else if (layer instanceof L.Circle) {
    var center = layer.getLatLng(),
      radius = layer.getRadius();
    return 'Center: '+strLatLng(center)+'<br />'
              +'Radius: '+_round(radius, 2)+' m';
    // Rectangle/Polygon - area
  } else if (layer instanceof L.Polygon) {
    var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs(),
      area = L.GeometryUtil.geodesicArea(latlngs);
    return 'Area: '+L.GeometryUtil.readableArea(area, true);
    // Polyline - distance
  } else if (layer instanceof L.Polyline) {
    var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs(),
      distance = 0;
    if (latlngs.length < 2) {
      return 'Distance: N/A';
    } else {
      for (var i = 0; i < latlngs.length-1; i++) {
        distance += latlngs[i].distanceTo(latlngs[i+1]);
      }
      return 'Distance: '+_round(distance, 2)+' m';
    }
  }
  return null;
};

const clustered = turf.clustersKmeans(dummyData, { numberOfClusters: dummyData.features.length/4 });

const startId = 270452360;
async function populateRandomBitmoji() {
  while (validRandomBitmojiIdArr.length < clustered.features.length) {
    const randomNum = Math.floor(Math.random() * 1000) + 1;
    const bitmojiId = (startId - randomNum);
    const url = 'https://images.bitmoji.com/render/panel/10220709-' + bitmojiId + '_2-s1-v1.png?transparent=1';
    const response = await fetch(url);
    if (response.status == 200) {
      validRandomBitmojiIdArr.push(bitmojiId);
    } else {
      await populateRandomBitmoji();
    }
  }
}

populateRandomBitmoji().then(() => {
  let index = 0;
  L.geoJSON(clustered, {
    onEachFeature: (feature, layer) => {
      let myPopup = '';
      myPopup += layer.feature.properties.CityState ? `City: ${layer.feature.properties.CityState}<br />` : '';
      myPopup += layer.feature.properties.Country ? `Country: ${layer.feature.properties.Country}<br />` : '';
      myPopup += typeof layer.feature.properties.cluster === 'number' ? `Room #${layer.feature.properties.cluster}<br />` : '';
      layer.bindPopup(myPopup);
    },
    pointToLayer: (_, latlng) => {
      return L.marker(latlng, {
        icon: L.icon({
          iconUrl: 'https://images.bitmoji.com/render/panel/10220709-' + validRandomBitmojiIdArr[index++] + '_2-s1-v1.png?transparent=1',
          iconSize:     [95, 95],
          iconAnchor:   [50, 90],
          popupAnchor:  [0, -75]
        })
      });
    }
  }).addTo(map);

  const clusteredByGroup = [];
  for (const cluster of clustered.features) {
    if (!clusteredByGroup[cluster.properties.cluster]) clusteredByGroup[cluster.properties.cluster] = { type: 'FeatureCollection', features: [] };
    clusteredByGroup[cluster.properties.cluster].features.push(cluster);
  }
  drawClusterBbox(clusteredByGroup);
  drawClusterCirlces(clusteredByGroup);
});

function drawClusterBbox(clusteredByGroup) {
  for (let i = 0; i < clusteredByGroup.length; i++) {
    const bbox = turf.bbox(clusteredByGroup[i]);
    const bboxPolygon = turf.bboxPolygon(bbox);
    const midpoint = turf.center(bboxPolygon).geometry.coordinates;
    clusteredByGroup[i].minRadius = turf.length(turf.lineString([midpoint, bboxPolygon.geometry.coordinates[0][0]]), { units: 'meters' });
    clusteredByGroup[i].midpoint = [midpoint[1], midpoint[0]];
    if (__DEV__) {
      drawnItems.addLayer(
        new L.GeoJSON(bboxPolygon)
      );
      drawnItems.addLayer(
        new L.GeoJSON(turf.lineString([midpoint, bboxPolygon.geometry.coordinates[0][0]]))
      );
    }
  }
}

function drawClusterCirlces(clusteredByGroup) {
  for (const { features, minRadius, midpoint } of clusteredByGroup) {
    let potentialRadius;
    switch (features.length) {
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
    drawnItems.addLayer(
      L.circle(midpoint, targetRadius).bindPopup(`
          Room #${features[0].properties.cluster}<br />
          Radius: ${(targetRadius/1000).toFixed(2)} Km<br />
          ${features.length} Users Within This Area`)
    );
  }
  // TODO: If N is substantially small (Such as only two markers on the map), extend the bbox to contain more than a single cluster
}

// Object created - bind popup to layer, add to feature group
map.on(L.Draw.Event.CREATED, function(event) {
  var layer = event.layer;
  var content = getPopupContent(layer);
  if (content !== null) {
    layer.bindPopup(content);
  }
  drawnItems.addLayer(layer);
});

// Object(s) edited - update popups
map.on(L.Draw.Event.EDITED, function(event) {
  var layers = event.layers,
    content = null;
  layers.eachLayer(function(layer) {
    content = getPopupContent(layer);
    if (content !== null) {
      layer.setPopupContent(content);
    }
  });
});

function jumpToLocation(map) {
  var locationLabel = document.getElementById('location');
  locationLabel.innerHTML = 'Your Location is: ';
  if (!navigator.geolocation){
    locationLabel.innerHTML = '<h4>Geolocation is not supported by your browser</h4>';
  } 
  function success(position) {
    var zoom = 16;
    var latitude  = position.coords.latitude;
    var longitude = position.coords.longitude;
    locationLabel.innerHTML = '<p>Latitude is ' + latitude + '° <br>Longitude is ' + longitude + '°</p>';
    defaultPosition.remove();
    L.marker([latitude, longitude], { icon: bitmojiIcon }).bindPopup('You are here').addTo(map);
    map.setView([latitude, longitude], zoom);
  }
  function error() {
    locationLabel.innerHTML = 'Unable to retrieve your location';
  }
  locationLabel.innerHTML = '<p>Locating…</p>';
  
  return navigator.geolocation.getCurrentPosition(success, error);
}