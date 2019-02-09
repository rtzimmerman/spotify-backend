
var express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const _ = require('lodash');
var app = express();
var MongoClient = require('mongodb').MongoClient;

const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASS = process.env.MONGODB_PASS;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const url = `mongodb://${MONGODB_USER}:%40${MONGODB_PASS}@ds058508.mlab.com:58508/playlist-analytics`;


function logMessage(){
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("playlist-analytics");
        var logMessage = { ipAddress: "10.0.0.1", ipLocation: "Denver, CO, USA", playlist: {track: 1, trackTitle: "Wild Horses"} };
        dbo.collection("logs").insertOne(logMessage, function(err, res) {
          if (err) throw err;
          console.log("1 log message was inserted");
          db.close();
        });
    });
}

app.get('/spotify', (request, response) => {
    console.log('backend spotify endpoint hit');
    logMessage();
    response.send('music');
});

app.get('/recommendations', (request, response) => {
   getRecommendtions();
   response.send('music playlist');
});

async function getRecommendtions() { 
    let refreshToken = await getRefreshToken();
    console.log('token: ' + refreshToken);
    const formInput = {
        genre: 'acoustic',
        positivity: 10,
        energy: 10,     
    }
    const baseUrl = 'https://api.spotify.com/v1/recommendations';
    var httpConfig = {
        headers: {
          'Authorization': 'Bearer ' + refreshToken,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    //// &max_danceability=${this.state.danceability}
    // Make a request for list of genres
    axios.get(`${baseUrl}?limit=10` +
    `&market=US` +
    // `&seed_artists=4NHQUGzhtTLFvgF5SZesLK` +
    `&seed_genres=${formInput.genre}` +
    // `&seed_tracks=0c6xIDDpzE81m2q797ordA` +
    // `&max_popularity=1` +
    `&min_valence=${0}` +
    `&max_valence=${formInput.positivity / 100.00 + 5}` +
    `&target_valence=${formInput.positivity / 100.00}` +
    `&min_energy=${0}` +
    `&max_energy=${formInput.energy / 100.00  + 5}` +
    `&target_energy=${formInput.energy / 100.00}`
    , httpConfig)
    .then((response) => {
        console.log(response.data.tracks);
    })
    .catch((error) => {
        console.log(error);
    });
}

function getRefreshToken() {
    const refreshUrl = `https://delicat-vin-94241.herokuapp.com/refresh?refresh_token=${REFRESH_TOKEN}`;
    return new Promise((resolve, reject) => {
        axios.get(refreshUrl)
        .then((response) => {
            console.log('token refreshed');
            console.log(response.data.access_token);
            resolve(response.data.access_token);
        })
        .catch((error) => {
            console.log(error);
            reject(error);
        });
    });
    // Make a request for list of genres
}

app.get('/get-genres', (req, res) => {
    console.log('getting genres...');

    const baseUrl = 'https://api.spotify.com/v1/recommendations/available-genre-seeds';
        var httpConfig = {
            headers: {
              'Authorization': 'Bearer ' + getRefreshToken(),
              'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        // Make a request for list of genres
        axios.get(baseUrl, httpConfig)
        .then((response) => {
            console.log(response);
            //this.setState({ genres: response.data.genres});
            res.send(response.data.genres);
        })
        .catch((error) => {
            console.log(error);
        });
});

app.listen(process.env.PORT || 5000);
console.log(`Server is now running on port: ${process.env.PORT}`);

