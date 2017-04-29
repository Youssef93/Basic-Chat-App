"use strict"

let app = require("express")();
let server = require('http').createServer(app);
let io = require('socket.io').listen(server);

const _ = require('lodash');

class Server {
    constructor(config, chatMongoClient) {
        server.listen(config.portNumber);
        this.chatMongoClient = chatMongoClient;

        app.get('/', (req, res) => {
            res.sendFile(config.uiDirectory);
        });

        io.sockets.on('connection', socket => {
            socket.on('user submission', userName => {
                chatMongoClient.getUserByUserName(userName).then(data => {
                    if(!data.userFound){
                        socket['userName'] = userName;
                        return chatMongoClient.insertNewUser({"userName": userName, "isOnline": true});
                    } else if(!data.isOnline){
                        socket['userName'] = userName;
                        return chatMongoClient.goOnline(userName);
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
        });
    }

    _updateNames() {
        return this.chatMongoClient.getAllUsers().then(users => {
            io.sockets.emit('update users', users);
            return users;
        });
    }
}

module.exports = Server;
