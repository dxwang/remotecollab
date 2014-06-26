// var socket = io();

$(document).ready(function () {


	$('#chat_form').submit(function (e) {
		e.preventDefault();
		sendChatMessage();
		$('#chat_message').val('');
	});


	// socket.on('chat', receiveChatMessage)

	function sendChatMessage() {
		msg = $('#chat_message').val();

		receiveChatMessage(msg);
		// socket.emit('chat', {'message': msg});
	}

	function receiveChatMessage(msg) {
		msg = $('<li>').text(msg);
	
		$('#messages').append(msg);
	}

});




