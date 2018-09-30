
const osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const snapchat = L.tileLayer('https://api.mapbox.com/styles/v1/nkmap/cjftto4dl8hq32rqegicxuwjz/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibmttYXAiLCJhIjoiY2lwN2VqdDh2MDEzbXN5bm9hODJzZ2NlZSJ9.aVnii-A7yCa632_COjFDMQ', {maxZoom: 18});
const fakeSnapchat = L.tileLayer('https://api.mapbox.com/styles/v1/ethanx94/cjgaaxn871il62sp1e80vkog1/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZXRoYW54OTQiLCJhIjoiY2pnYWF0YWZvMW5neTJ5bXQ3d2VuaDBrcCJ9.jYfc6WsaQ7jMNm0GGr27Zw', {maxZoom: 18});
const osm = L.tileLayer(osmUrl, {maxZoom: 18, attribution: osmAttrib});
const map = new L.Map('map', {center: new L.LatLng(37.7220, -89.2043), zoom: 15});
const drawnItems = L.featureGroup().addTo(map);

L.control.layers({
    "snapchat": snapchat.addTo(map),
    "fakeSnapchat": fakeSnapchat,
    "osm": osm,
    "google": L.tileLayer('http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
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
    return "("+_round(latlng.lat, 6)+", "+_round(latlng.lng, 6)+")";
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
        return "Center: "+strLatLng(center)+"<br />"
              +"Radius: "+_round(radius, 2)+" m";
    // Rectangle/Polygon - area
    } else if (layer instanceof L.Polygon) {
        var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs(),
            area = L.GeometryUtil.geodesicArea(latlngs);
        return "Area: "+L.GeometryUtil.readableArea(area, true);
    // Polyline - distance
    } else if (layer instanceof L.Polyline) {
        var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs(),
            distance = 0;
        if (latlngs.length < 2) {
            return "Distance: N/A";
        } else {
            for (var i = 0; i < latlngs.length-1; i++) {
                distance += latlngs[i].distanceTo(latlngs[i+1]);
            }
            return "Distance: "+_round(distance, 2)+" m";
        }
    }
    return null;
};

const places = omnivore.kml('https://cors-anywhere.herokuapp.com/https://batchgeo.com/map/kml/ethanx94')
  .on('ready', function() {
      places.eachLayer(function(layer) {
          let myPopup = '';
          myPopup += layer.feature.properties.City ? `City: ${layer.feature.properties.City}<br />` : '';
          myPopup += layer.feature.properties.Month ? `Month: ${layer.feature.properties.Month}<br />` : '';
          myPopup += layer.feature.properties.Year ? `Year: ${layer.feature.properties.Year}<br />` : '';
          myPopup += layer.feature.properties.Country ? `Country: ${layer.feature.properties.Country}<br />` : '';
          myPopup += layer.feature.properties.Notes ? `Notes: ${layer.feature.properties.Notes}` : '';
          layer.bindPopup(myPopup);
      });
  })
  .addTo(map);

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
    locationLabel.innerHTML = "<h4>Geolocation is not supported by your browser</h4>";
  } 
  function success(position) {
    var zoom = 16;
    var accuracyRadius = 500; // Hardcoded
    var latitude  = position.coords.latitude;
    var longitude = position.coords.longitude;
    locationLabel.innerHTML = '<p>Latitude is ' + latitude + '° <br>Longitude is ' + longitude + '°</p>';
    L.marker([latitude, longitude]).addTo(map);
    L.circle([latitude, longitude], accuracyRadius).addTo(map);
    map.setView([latitude, longitude], zoom);
  }
  function error(e) {
    locationLabel.innerHTML = "Unable to retrieve your location";
  }
  locationLabel.innerHTML = "<p>Locating…</p>";
  
  return navigator.geolocation.getCurrentPosition(success, error);
}