var socket = io.connect('ec2-54-84-82-90.compute-1.amazonaws.com:3000');

$(document).ready(function () {


	$('#chat_form').submit(function (e) {
		e.preventDefault();
		sendChatMessage();
		$('#chat_message').val('');
	});


	socket.on('chat', receiveChatMessage)

	function sendChatMessage() {
		msg = $('#chat_message').val();
		printChatMessage("You: " + msg);

		socket.emit('chat', {'message': msg});
	}

	function printChatMessage(msg) {
		msg = $('<li>').text(msg);
	
		$('#messages').append(msg);
	}

	function receiveChatMessage(msg) {
		printChatMessage(msg.message);
	}

});




