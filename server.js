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
app.get('/yelp', getRestaurants);
app.get('/movies', getMovies);
app.get('/meetups', getMeetup);
app.get('/trails', getTrail);

// Helper Functions

function searchToLatLong(query) {
  //Originally this referenced getting mock data from the JSON file as initial set up. Since the project is designed to work with APIs the code needed to be updated to submit search queries to APIs and return results.

  //Concatenate URL
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

  //Make proxy request
  return superagent.get(url)
    //Recieve info
    .then((res) => {
      // console.log(res.body.results[0]);
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

function getRestaurants(request, response) {
  const url = `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`;

  superagent.get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then(result => {
      // console.log(result.body);
      const restaurantSummaries = result.body.businesses.map(business => {
        return new Restaurant(business);
      });
      response.send(restaurantSummaries);
    })
    .catch(error => handleError(error, response));
}

function getMovies(request, response) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIESDB_API_KEY}&language=en-US&query=${request.query.data.search_query}`

  superagent.get(url)
    .then(result => {
      //console.log(result.body);
      const movieSummaries = result.body.results.map(film => {
        return new Movie(film);
      });
      response.send(movieSummaries);
    })
    .catch(error => handleError(error, response));
}

function getMeetup(request, response) {
  const url = `https://api.meetup.com/find/upcoming_events?&sign=true&photo-host=public&page=20&lat=${request.query.data.latitude}&lon=${request.query.data.longitude}&key=${process.env.MEETUPS_API_KEY}`


  superagent.get(url)
    .then(result => {
      // console.log('Body: ', result.body);
      const meetupSummaries = result.body.events.map(event => {
        return new Meetup(event);
      });
      response.send(meetupSummaries);
    })
    .catch(error => handleError(error, response));
}

function getTrail(request, response) {
  const url =  `https://www.hikingproject.com/data/get-trails?lat=${request.query.data.latitude}&lon=${request.query.data.longitude}&maxDistance=10&key=${process.env.TRAILS_API_KEY}`

  superagent.get(url)
    .then(result => {
      console.log(result.body);
      const trailSummaries = result.body.trails.map(hike => {
        return new Trail(hike);
      });
      response.send(trailSummaries);
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
  // console.log(this);
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function Restaurant(business) {
  this.name = business.name;
  this.image_url = business.image_url;
  this.price = business.price;
  this.rating = business.rating;
  this.url = business.url;
}

function Movie(film){
  this.title = film.title;
  this.overview = film.overview;
  this.average_votes = film.average_votes;
  this.total_votes = film.total_votes;
  this.image_url = `http://image.tmdb.org/t/p/w185/${film.poster_path}`;
  this.popularity = film.popularity;
  this.release_date = film.release_date;
}

function Meetup(event) {
  this.link = `http://www.meetup.com/${event.link}`;
  this.name = event.name;
  this.creation_date = new Date(event.created);
  this.host = event.group.name;
}

function Trail(hike) {
  this.name = hike.name;
  this.location = hike.location;
  this.length = hike.length;
  this.stars = hike.stars;
  this.star_votes = hike.starVotes;
  this.summary = hike.summary;
  this.trail_url = `https://www.hikingproject.com/trail/${hike.id}/${hike.name}`;
  this.conditions = hike.conditionDetails;
  this.conditions_date = hike.conditionDate;
  this.condition_time = hike.conditionDate;

}
// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is up on ${PORT}`));
