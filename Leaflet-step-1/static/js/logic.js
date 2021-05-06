

var API_quakes = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
//var API_quakes = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

//var API_plates = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

//var fault_line_url = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// Create a map.
function createMap(quakeLayers, legend) {

  // Create the tile layer that will be the background of the world map displaying earthquakes.
  var lightMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
      attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
      maxZoom: 18,
      id: "mapbox.light",
      accessToken: API_KEY
  });
  
  // Create a map using the lightMap tile layer and the earthquake layers (quakeLayers).
  var myMap = L.map("map-id", {
      center: [36.77, -119.41],
      zoom: 6,
      layers: [lightMap].concat(d3.values(quakeLayers))
      // layers: [lightMap,quakeLayers]
  });
  
  // Add the legend to the map.
  legend.addTo(myMap);
}


// Add tool tip and pop up information to each earthquake marker.
function addPopupInfo(feature, layer) {

  // If this feature has properties named 'mag', 'place' and 'time', add a Tool Tip.
  if (feature.properties && feature.properties.mag &&
      feature.properties.place && feature.properties.time) {
          layer.bindTooltip('<div align="center"><div>Magnitude: '  + feature.properties.mag +
                            '</div><div>Place: ' + feature.properties.place +
                            '</div><div>Date: ' + new Date(+feature.properties.time).toDateString());
  }

}

// Perform an API call to the USGS API to get earthquake information (past 30 days, 2.5+ magnitude and greater)
//
d3.json(API_quakes).then((geojsonData) => {
  console.log(geojsonData);

  // Create a logarithmic color scale for filling the earthquake
  // markers. Set a default color for the ring around an earthquake
  // marker.
  //
  var colorRange = ['#B6F44C', '#EC6A6A'],
      ringColor = '#000000',
      magMinMax   = d3.extent(geojsonData.features.map((f) => f.properties.mag)),
      range      = [0, geojsonData.features.length - 1];
      getType   = d3.extent(geojsonData.features.map((f) => f.properties.type)),
      magDomain = [1,magMinMax[1]]
      //Log number of features in the console. Keeping 'range' for future feature.
      console.log(range);
      console.log(magMinMax)
  // Create a legend.
  var legend  = L.control({position: 'bottomright'}),
      magBins = d3.ticks(Math.floor(magMinMax[0]), magMinMax[1], Math.ceil(magMinMax[1] - magMinMax[0]));


  // Scale the colors.
  var colorScaleQuake  = d3.scaleLinear().domain(magMinMax).range(colorRange);
      colorScaleLegend  = d3.scaleLinear().domain(magDomain).range(colorRange);
  

  // Implement the 'onAdd()' function.
  legend.onAdd = function () {

      var div = L.DomUtil.create('div', 'info legend');

      div.innerHTML += "<h4 style='margin:4px'>Magnitude</h4>"

      // Testing color in legend
      // div.innerHTML += '<i style="background: ' + testColor + '"></i> test<br>';

      for (var i = 2; i < magBins.length; i++) {
          div.innerHTML +=
              '<i style="background: ' + colorScaleLegend(magBins[i]) + '"></i> ' +
              magBins[i] + (magBins[i + 1] ? '&ndash;' + magBins[i + 1] : '+') + '<br>';
      }
     
      return div;
  }


  
  // Initialize an object used to hold the earthquake layers.
  var quakeLayers = {};

  for (var i = 2; i < magBins.length; i++) {

      // Create an overlay layer of earthquake markers for quakes within a magnitude range.
      var quakeLayer = L.geoJSON(geojsonData.features, {
                  filter: function (feature) {
                      return (i == magBins.length - 1 ?
                              (+feature.properties.mag >= magBins[i]) :
                              (+feature.properties.mag >= magBins[i])  &&
                              (+feature.properties.mag < magBins[i + 1]));
                  },
                  pointToLayer: function (feature, latlng) {
                      return L.circleMarker(latlng, {
                      radius: +feature.properties.mag * 4,
                      fillColor: colorScaleQuake(+feature.properties.mag),
                      color: ringColor ,
                      weight: 1,
                      fillOpacity: 1,
                  });
                  },
                  onEachFeature: addPopupInfo,
              });

      // Create a label for the magnitude bin and add the layer to quakeLayers.
      var lvlKey = magBins[i] + (magBins[i + 1] ? '-' + magBins[i + 1] : '+');
      quakeLayers[lvlKey] = quakeLayer;
  };


  // Pass the earthquake overlay layers, the timeline overlay layer and the
  // legend to the createMap() function.
  createMap(quakeLayers, legend);

}, (reason) => {
  console.log(reason);
});




