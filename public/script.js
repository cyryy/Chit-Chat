const socket = io();

let currentRoom = '';

function login() {
    const username = document.getElementById('username').value;
    if (username) {
        socket.emit('login', username);
        document.getElementById('login').style.display = 'none';
        document.getElementById('chat-container').style.display = 'block';
    }
}

function joinRoom() {
    const room = document.getElementById('room-name').value;
    if (room) {
        currentRoom = room;
        socket.emit('joinRoom', room);
        document.getElementById('chat').innerHTML = '';
    }
}

function sendMessage() {
    const message = document.getElementById('message').value;
    if (message && currentRoom) {
        socket.emit('chatMessage', { message, room: currentRoom });
        document.getElementById('message').value = '';
    }
}

function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const fileLink = `/uploads/${data.filename}`;
            socket.emit('chatMessage', { message: `File shared: ${fileLink}`, room: currentRoom });
        })
        .catch(error => console.error('Error:', error));
    }
}

socket.on('userList', (users) => {
    console.log('Connected users:', users);
});

socket.on('previousMessages', (messages) => {
    const chatDiv = document.getElementById('chat');
    messages.forEach(message => {
        const messageElement = document.createElement('p');
        messageElement.textContent = `${message.user}: ${message.text}`;
        chatDiv.appendChild(messageElement);
    });
    chatDiv.scrollTop = chatDiv.scrollHeight;
});

socket.on('message', (message) => {
    const chatDiv = document.getElementById('chat');
    const messageElement = document.createElement('p');
    messageElement.textContent = `${message.user}: ${message.text}`;
    chatDiv.appendChild(messageElement);
    chatDiv.scrollTop = chatDiv.scrollHeight;
});
function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('File uploaded successfully:', data);
            const fileLink = `/uploads/${data.filename}`;
            socket.emit('chatMessage', { message: `File shared: ${fileLink}`, room: currentRoom });
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        });
    } else {
        console.error('No file selected');
        alert('Please select a file to upload.');
    }
}