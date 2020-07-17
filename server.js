//app.js
const express = require('express');
const app = express();
let randomColor = require('randomcolor');
const uuid = require('uuid');

let users = [];
let connections = [];

//middlewares
app.use(express.static('public'));

//routes
app.get('/', (req,res)=>{
    res.sendFile(__dirname + 'server/client/index.html');
});

//Listen on port 5000
server = app.listen( process.env.PORT || 5000);

const io = require('socket.io')(server);
//Do actions to initialize the website upon detecting a connection through Socket.io
io.on('connection', (socket) =>{
    console.log('A connection has been made');
    io.sockets.emit('newJoin');
    //Add the current connection to the connections array
    connections.push(socket);
    //Randomize a color
    let color = randomColor();

    //Set the username for the connection
    socket.username = 'DEFAULT';
    socket.color = color;

    socket.on('change_username', data =>{
        let id = uuid.v4();
        socket.id = id;
        socket.username = data.nickName;
        users.push({id, username: socket.username});
        updateUsernames();
    });
    const updateUsernames = () =>{
        io.sockets.emit('get users', users);
    };
    socket.on('message', (data) => {
        io.sockets.emit('message', {message: data.message, username : socket.username});
    });
    socket.on('disconnect', data =>{

        if(!socket.username){
            return;
        }
        for(let i=0;i<users.length;i++){
            if(users[i].id == socket.id){
                user = users[i];
                break;
            }
        }
    });
    socket.on('commandOutput', (data) =>{
        io.sockets.emit('commandOut', {CMDmessage: data.cmdMessage});
    });
});