"use strict"

let app = require("express")();
let server = require('http').createServer(app);
let io = require('socket.io').listen(server);

const _ = require('lodash');

class Server {
    constructor(config, chatMongoClient) {
        let clients = {};
        server.listen(config.portNumber);
        this.chatMongoClient = chatMongoClient;

        app.get('/', (req, res) => {
            res.sendFile(config.uiDirectory);
        });

        io.sockets.on('connection', socket => {
            clients[socket.id] = socket;
            socket.on('user submission', userName => {
                chatMongoClient.getUserByUserName(userName).then(data => {
                    if(!data.userFound){
                        socket['userName'] = userName;
                        return chatMongoClient.insertNewUser({"userName": userName, "isOnline": true, "socketID": socket.id});
                    } else if(!data.isOnline){
                        socket['userName'] = userName;
                        return chatMongoClient.goOnline(userName, socket.id);
                    } else {
                        return new Promise((resolve, reject) => {
                            let temp = {
                                "result" : {
                                    "ok": 0
                                }
                            };

                            resolve(temp);
                        });
                    }
                }).then(result => {
                    let temp ;
                    if(result.result.ok) {
                        temp = {
                            "isLogged": true,
                            "userName": userName
                        };

                        this._updateNames();
                    } else {
                        temp = {
                            "isLogged": false,
                            "message": "User is already logged in"
                        }
                    }

                    socket.emit("user login result", temp);
                    return temp;
                }).catch(error => {
                    throw error;
                });
            });

            socket.on('disconnect', () => {
                chatMongoClient.goOffline(socket.userName).then(result => {
                    this._updateNames();
                });
            });

            socket.on('initalizeChatFromClient', users => {
                return chatMongoClient.getActiveSocketID(users.user2).then(socketID => {
                    return clients[socketID].emit("initializeChatFromServer", users.user1);
                }).catch(error => {
                    throw error;
                });
            });

            socket.on("chatAcceptedVerification", data => {
                chatMongoClient.getActiveSocketID(data.user1).then(socketID => {
                    clients[socketID].emit("chatInitalizedResult", {"user2": data.user2, "isAccepted": data.isAccepted});
                });
            });
        });
    }

    _updateNames() {
        return this.chatMongoClient.getAllUsers().then(users => {
            let onlineUsers = _.filter(users, user => {
                return (user['isOnline'] == true);
            });

            let offlineUsers = _.filter(users, user => {
                return (user['isOnline'] == false);
            });

            if(_.isNil(onlineUsers))
                onlineUsers = [];

            if(_.isNil(offlineUsers))
                offlineUsers = [];

            let allusers = {
                onlineUsers,
                offlineUsers
            };

            io.sockets.emit('update users', allusers);
            return users;
        });
    }
}

module.exports = Server;
