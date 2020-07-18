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
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 8000;
}

server = app.listen(port);

console.log(`Listening on ${port}`);

const io = require('socket.io')(server);
//Do actions to initialize the website upon detecting a connection through Socket.io
io.on('connection', (socket) => {
    var cmds = {
        help: {
            trigger: "help",
            explain: "Run this command to either display all commands, or get an explanation of a singular command instead of the whole catalog. Parameter(s): [function]",
            run: function help() {
                if (params[1] !== undefined) {
                    for (let i in cmds) {
                        if (cmds[i].trigger == params[1]) {
                            socket.emit('CMDmessage', {
                                feedback: `${cmds[i].trigger} : ${cmds[i].explain}`,
                                color: 'blue',
                                action: 'helps'
                            });
                            return;
                        }
                    }
                    socket.emit('CMDmessage', {
                        feedback: `//help failed :: reason: Unable to find specified command`,
                        color: 'red',
                        action: 'failed'
                    });
                } else {
                    for (let i in cmds) {
                        socket.emit('CMDmessage', {
                            feedback: `${cmds[i].trigger} : ${cmds[i].explain}`,
                            color: 'blue',
                            action: 'helps'
                        });
                    }
                }
            }
        },
        setusername: {
            trigger: "setusername",
            explain: "Run this command to change your username. Parameter(s): (NAME)",
            run: function changeName() {
                if (params[1]) {
                    let id = uuid.v4();
                    socket.id = id;
                    socket.username = params[1].substr(0, 10);
                    users.push({
                        id,
                        username: socket.username
                    });
                    socket.emit('CMDmessage', {
                        feedback: `Username changed. Your new username is ${socket.username}`,
                        color: 'yellow',
                        action: 'success'
                    });
                    socket.emit('setCookie', {cookieName: 'username', cookieContents: socket.username});
                } else {
                    socket.emit('CMDmessage', {
                        feedback: `//setusername failed :: reason : Unspecified required parameter`,
                        color: 'red',
                        action: 'failed'
                    });
                }
            }
        },
        test: {
            trigger: "test",
            explain: 'This command is used to test (on the backend) if commands are being properly processed. You will not recieve a response on the front end, this is purely for debugging purposes.',
            run: () => {
                console.log('success');
            }
        }
    };
    console.log('A connection has been made');
    //Add the current connection to the connections array
    connections.push(socket);
    socket.on('change_username', data => {
        let id = uuid.v4();
        socket.id = id;
        socket.username = data.nickName.substr(0, 10);
        users.push({
            id,
            username: socket.username
        });
        socket.emit('setCookie', {cookieName: 'username', cookieContents: socket.username});
    });
    socket.on('mobile_username', data => {
        if (data.nickName.substr(0, 12) == 'MOBILE_USER_') {
            let id = uuid.v4();
            socket.id = id;
            socket.username = data.nickName.substr(0, 17);
            users.push({
                id,
                username: socket.username
            });
        } else {
            socket.emit('CMDmessage', {
                feedback: 'Data validation for your username has failed. Setting to \'undefined\'...',
                color: 'red',
                action: 'failed'
            });
            socket.username = undefined;
        }
    });
    socket.on('message', (data) => {
        if (data.message.substr(0, 2) == "//") {
            input = data.message.split("//");
            params = input[1].split(" ");
            for (let i in cmds) {
                if (cmds[i].trigger == params[0]) {
                    cmds[i].run();
                    return;
                }
            }
            socket.emit('CMDmessage', {
                feedback: 'Unknow command. (Check your spelling!)',
                color: 'red',
                action: 'failed'
            });
        } else {
            io.sockets.emit('message', {
                message: data.message,
                username: socket.username
            });
        }
    });
    socket.on('disconnect', data => {
        io.sockets.emit('left', {
            user: socket.username
        });
        if (!socket.username) {
            return;
        }
        for (let i = 0; i < users.length; i++) {
            if (users[i].id == socket.id) {
                user = users[i];
                break;
            }
        }
    });
    socket.on('commandOutput', (data) => {
        io.to(socket.id).emit('commandOut', {
            CMDmessage: data.cmdMessage
        });
    });
    socket.on('id_store', (data) => {
        socket.username = `MOBILE_USER_` + data.mobileid;
    });
    socket.on('oldJoin', (data) => {
        io.sockets.emit('oJoin', {
            user: socket.username
        });
    });
    socket.on('newJoin', () => io.sockets.emit('nJoin'));
});