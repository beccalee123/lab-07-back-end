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

app.get('/weather', getWeather);

// Helper Functions

function searchToLatLong(query) {
  //Originally this referenced getting mock data from the JSON file as initial set up. Since the project is designed to work with APIs the code needed to be updated to submit search queries to APIs and return results.
  
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

function getWeather(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.DARKSKY_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then(result => {
      const weatherSummaries = result.body.daily.data.map(day => {
        return new Weather(day);
      });

      response.send(weatherSummaries);
    })
    .catch(error => handleError(error, response));
}

//Error Handling

//Error handler for alerting developer in node if the internal server is having issues processing the request. This will help debug the code if there are issues with it populating in the client side app.
function handleError(error, res) {
  console.error(error);
  if (res) res.status(500).send('Sorry, something broke');
}

//Models

//This object constructor designates the information we want to recieve back from the API. As a result of this, the API will return an object with the requested data.
function Location(query, data) {
  this.search_query = query;
  this.formatted_query = data.formatted_address;
  this.latitude = data.geometry.location.lat;
  this.longitude = data.geometry.location.lng;
  console.log(this);
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is up on ${PORT}`));
