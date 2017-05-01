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
                        return {
                            "result": {
                                "ok": 0
                            }
                        };
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
                    console.log(error);
                });
            });

            socket.on('disconnect', () => {
                chatMongoClient.removeSocketFromChat(socket.id).then(result => {
                    if(result.isFound) {
                        let user2SocketID = result['otherUserSocketID'];
                        clients[user2SocketID].emit('userLeftChat', {"userName": socket.userName, "socketID": socket.id});
                    }

                    return  true;
                }).then(data => {
                    return chatMongoClient.goOffline(socket.userName);
                }).then(result => {
                    this._updateNames();
                });
            });

            socket.on('save chat', data => {
                console.log(data.history);
                let chatHistoryName = this._getChatHistoryName(data.user1, data.user2);
                chatMongoClient.saveChatHistory(chatHistoryName, data.history);
            });

            socket.on('requestChatFromClient', users => {
                return chatMongoClient.checkUserInChat(users.user2).then(result => {
                    if(result) {
                        socket.emit("initializeChat", {
                            "otherUser": users.user2,
                            "isAccepted": false,
                            "message": users.user2 + " is already in another chat"
                        });

                        return null;
                    } else {
                        return chatMongoClient.getActiveSocketID(users.user2);
                    }
                }).then(socketID => {
                    if(socketID != null)
                        return clients[socketID].emit("requestChatFromServer", users.user1);
                }).catch(error => {
                    console.log(error);
                });
            });

            socket.on('send message', msg => {
                chatMongoClient.getChat(socket.userName).then(result => {
                    clients[result.socketID].emit('show message', msg);
                    socket.emit('show message', msg);
                });
            });

            socket.on("chatAcceptedVerification", data => {
                if(data.isAccepted){
                    let chatHistory ;
                    return chatMongoClient.loadChatHistory(this._getChatHistoryName(data.user1, data.user2)).then(history => {
                        chatHistory = history;
                        return chatMongoClient.getActiveSocketID(data.user1);
                    }).then(socketID => {
                        let message = data.user2 + " has accepted to chat with you";
                        clients[socketID].emit("initializeChat", {
                            "otherUser": data.user2,
                            "isAccepted": data.isAccepted,
                            "message": message,
                            "history": chatHistory
                        });

                        socket.emit("initializeChat", {
                            "otherUser": data.user1,
                            "isAccepted": data.isAccepted,
                            "message": "You are now chatting with " + data.user1,
                            "history": chatHistory
                        });

                        return chatMongoClient.startChat({
                            "userName": data.user1,
                            "socketID": socketID
                        }, {
                            "userName": data.user2,
                            "socketID": socket.id
                        });
                    }).catch(error => {
                        console.log(error);
                    });

                } else {
                    return chatMongoClient.getActiveSocketID(data.user1).then(socketID => {
                        message += data.user2 + " has refused to chat with you";
                        clients[socketID].emit("initializeChat", {
                            "otherUser": data.user2,
                            "isAccepted": data.isAccepted,
                            "message": message
                        });
                    });
                }
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

    _getChatHistoryName(user1, user2) {
        let users = [user1, user2];
        users.sort();
        return users[0] + " - " + users[1];
    }
}

module.exports = Server;
