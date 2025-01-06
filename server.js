const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
}

// Set up file upload (only once)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Serve static files
app.use(express.static('public'));

// In-memory storage for users and messages
const users = new Map();
const chatRooms = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('login', (username) => {
        users.set(socket.id, username);
        io.emit('userList', Array.from(users.values()));
    });

    socket.on('joinRoom', (room) => {
        socket.join(room);
        if (!chatRooms.has(room)) {
            chatRooms.set(room, []);
        }
        socket.emit('previousMessages', chatRooms.get(room));
    });

    socket.on('chatMessage', (data) => {
        const message = {
            user: users.get(socket.id),
            text: data.message,
            room: data.room,
            timestamp: new Date()
        };
        chatRooms.get(data.room).push(message);
        io.to(data.room).emit('message', message);
    });

    socket.on('disconnect', () => {
        users.delete(socket.id);
        io.emit('userList', Array.from(users.values()));
        console.log('A user disconnected');
    });
});

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        console.log('File uploaded:', req.file);
        res.json({ filename: req.file.filename });
    } else {
        console.error('File upload failed');
        res.status(400).send('No file uploaded.');
    }
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});