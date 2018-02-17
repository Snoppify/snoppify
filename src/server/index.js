require('dotenv').config();

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const spotify = require('./spotify');

//////////////
/// DEBUG

var stdin = process.stdin;

// without this, we would only get streams once enter is pressed
stdin.setRawMode(true);

// resume stdin in the parent process (node app won't quit all by itself
// unless an error or process.exit() happens)
stdin.resume();

// i don't want binary, do you?
stdin.setEncoding('utf8');

function makeid() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < 5; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

// on any data into stdin
stdin.on('data', function(key) {
	// ctrl-c ( end of text )
	if (key === '\u0003') {
		process.exit();
	}
	switch (key) {
		case 'q':
			let id = makeid();
			spotify.controller.queueSong({
				id: id,
				name: "song_" + id,
			});
			process.stdout.write("queue: " + spotify.controller.queue + "\n");
			break;
		case 'n':
			let next = spotify.controller.playNext();
			process.stdout.write("play next: " + JSON.stringify(next) + "\n");
			break;
		case 'd':
			let index = Math.floor(Math.random() * Math.floor(spotify.controller.queue.size));
			let item = spotify.controller.queue.getAt(index);
			spotify.controller.dequeueSong(item);
			process.stdout.write("dequeue: " + JSON.stringify(item) + "\n");
			break;
		case 'l':
			process.stdout.write("queue: " + spotify.controller.queue + "\n");
			break;
	}
	// write the key to stdout all normal like
	//process.stdout.write(key);
});

/// END DEBUG
//////////////

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

app.get('/spotify-authorize', (req, res) => {
	console.log("auth", req.query);
	res.sendFile(__dirname + '/index.html');
	//spotify.playbackAPI.authorize(req.params.code);
});

io.on("connection", (socket) => {
	console.log("we got a live one" /*, socket*/ );

	socket.on("search", (string) => {
		spotify.api.searchTracks(string)
			.then(data => socket.emit("search", JSON.stringify(data.body)));
	});

	socket.on("getTrack", (id) => {
		Promise.all([
				spotify.api.getTracks([id]),
				spotify.api.getAudioFeaturesForTracks([id])
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

	socket.on("playSong", (id) => {
		spotify.controller.playSong(id);
	});

	socket.on("play", (id) => {
		spotify.controller.play();
	});

	socket.on("stop", (id) => {
		spotify.controller.stop();
	});

	socket.on("pause", (id) => {
		spotify.controller.pause();
	});
});

http.listen(3000, () => {
	console.log('listening on *:3000');
});