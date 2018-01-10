const express = require('express');

const app = express();
var server = app.listen(4000);

const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(server);



// Connect to mongo
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db) {
	if(err) {
		throw err;
	}

	console.log('MongoDb Connected');


	// Connect
	client.on('connection', function(socket) {
		let chat = db.collection('chats');

		// Create function to send status
		sendStatus = function(s){
			socket.emit('status', s);
		}
		// Get chats from Mongo collection
		chat.find().limit(100).sort({_id: 1}).toArray(function(err, res) {
			if(err) {
				throw err;
			}

			// emit the messages
			socket.emit('output', res);
		})
		//handle input events
		socket.on('input', function(data) {
			let name = data.name;
			let message = data.message;

			//check for name and msg
			if(name == '' || message == '') {
				// send error status
				sendStatus('Please enter a name and message')
			} else {
				//insert message
				chat.insert({name: name, message: message}, function(){
					client.emit('output', [data]);

					// Send Status object
					sendStatus({
						message: 'Message Sent',
						clear: true
					})
				});
			}
		})
		// handle clear
		socket.on('clear', function(data) {
			//Remove all chats from collection
			chat.remove({}, function() {
				//Emit cleard
				socket.emit('cleared');
			})
		})
	});
});