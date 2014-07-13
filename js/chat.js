var socket = io.connect('ec2-54-85-43-74.compute-1.amazonaws.com:3000');
//var socket = io.connect('localhost:3000');

>>>>>>> 56f6520a41008ff8ffc457b212e2243f5a9bf1d9
$(document).ready(function () {
	

	$('#chat_form').submit(function (e) {
		e.preventDefault();
		// Send current message to server
		sendChatMessage();
		// Clear chat box message
		$('#chat_message').val('');
	});

	// Create socket event for a chat message
	socket.on('chat', receiveChatMessage)


	function sendChatMessage() {
		msg = $('#chat_message').val();
		printChatMessage("You: " + msg);

		socket.emit('chat', {'message': msg});
	}

	// Add last message to list of chat messages
	function printChatMessage(msg) {
		msg = $('<li>').text(msg);

		$('#messages').append(msg);
	}

	function receiveChatMessage(msg) {
		printChatMessage(msg.message);
	}

});




