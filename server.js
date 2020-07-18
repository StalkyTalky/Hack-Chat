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
    res.sendFile(__dirname + '/server/client/index.html');
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}


server = app.listen(port);

const io = require('socket.io')(server);
//Do actions to initialize the website upon detecting a connection through Socket.io
io.on('connection', (socket) =>{
    console.log('A connection has been made');
    //Add the current connection to the connections array
    connections.push(socket);

    //Set the username for the connection
    socket.on('change_username', data =>{
        let id = uuid.v4();
        socket.id = id;
        socket.username = data.nickName.substr(0,10);
        users.push({id, username: socket.username});
    });
    socket.on('message', (data) => {
        io.sockets.emit('message', {message: data.message, username : socket.username});
    });
    socket.on('disconnect', data =>{
        io.sockets.emit('left', {user: socket.username});
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
    socket.on('id_store', (data)=>{
        socket.username = `MOBILE_USER_`+data.mobileid;
    });
    socket.on('oldJoin', (data)=>{
        io.sockets.emit('oldJoin', {user: socket.username});
    });
    sockets.on('newJoin', ()=>io.sockets.emit('newJoin'));
});