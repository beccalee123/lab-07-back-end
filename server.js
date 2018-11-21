'use strict';

// Application dependencies (Express & CORS)
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

// Load environment variables with DotENV
require('dotenv').config();

// Application setup
const PORT = process.env.PORT; // environment variables
const app = express(); // creates app instance
app.use(cors()); // tells app to use cors

// API Routes
app.get('/location', (request, response) => {
  searchToLatLong(request.query.data)
    .then((location) => response.send(location))
    .catch((error) => handleError(error, response));
});

// Helper Functions
function searchToLatLong(query) {
  //The below got deleted since we're replacing with an API key
  // const geoData = require('./data/geo.json'); 
  // const location = new Location(geoData.results[0]);
  // location.search_query = query;
  // return location;

  //Concatenate URL
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

  //Make proxy request
  return superagent.get(url)
    //Recieve info
    .then((res) => {
      console.log(res.body.results[0]);
      //return new instance/modify object
      return new Location(query, res.body.results[0]);
    })
    .catch((error, res) => handleError(error, res));
}

function handleError(error, res) {
  console.error(error);
  if (res) res.status(500).send('Sorry, something broke');
}

function Location(query, data) {
  this.search_query = query;
  this.formatted_query = data.formatted_address;
  this.latitude = data.geometry.location.lat;
  this.longitude = data.geometry.location.lng;
  console.log(this);
}

app.listen(PORT, () => console.log(`App is up on ${PORT}`));
