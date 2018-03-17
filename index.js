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