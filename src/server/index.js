require('dotenv').config();

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const SpotifyWebApi = require("spotify-web-api-node");

const spotifyApi = new SpotifyWebApi({
	clientId: process.env.JOHN_CLIENT_ID,
	clientSecret: process.env.JOHN_CLIENT_SECRET,
});

spotifyApi.clientCredentialsGrant().then(function(data) {
	console.log('The access token expires in ' + data.body['expires_in']);
	console.log('The access token is ' + data.body['access_token']);

	// Save the access token so that it's used in future calls
	spotifyApi.setAccessToken(data.body['access_token']);
}, function(err) {
	console.log('Something went wrong when retrieving an access token', err);
});


app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

io.on("connection", (socket) => {
	console.log("we got a live one" /*, socket*/ );

	socket.on("search", (string) => {
		spotifyApi.searchTracks(string)
			.then(data => socket.emit("search", JSON.stringify(data.body)));
	});

	socket.on("getTrack", (id) => {
		Promise.all([
				spotifyApi.getTracks([id]),
				spotifyApi.getAudioFeaturesForTracks([id])
			])
			.then(data => {
				var track = data[0].body.tracks[0];
				track.audio_features = data[1].body.audio_features[0];

				socket.emit("getTrack", JSON.stringify(track));
			})
			.catch(data => {
				socket.emit("getTrack", null);
			});
	});
});

http.listen(3000, () => {
	console.log('listening on *:3000');
});