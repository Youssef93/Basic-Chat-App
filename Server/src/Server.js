"use strict"

let app = require("express")();
let server = require('http').createServer(app);
let io = require('socket.io').listen(server);

let MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

class Server {
    constructor(config) {
        this.uiDirectory = config.uiDirectory;
        this.portNumber = config.portNumber
        this.dbURL = config.dbURL;
        this.usersCollection = config.usersCollection;
        this.chatsCollections = config.chatsCollection;

        server.listen(this.portNumber);

        app.get('/', (req, res) => {
            res.sendFile(this.uiDirectory);
        });

        io.sockets.on('connection', socket => {
            socket.on('user submission', userName => {
                let loginResult = {};
                loginResult['isLogged'] = true;
                loginResult['data'] = userName;

                let tempDB, usersCollection ;

                return MongoClient.connect(this.dbURL).then(db => {
                    tempDB = db;
                    return db.collection(config.usersCollection);
                }).then(collection => {
                    usersCollection = collection;
                    return collection.findOne({"userName" : userName});
                }).then(result => {
                    if(result == null) {
                        return usersCollection.insertOne({"userName" : userName, "isOnline": true});
                    } else if(result.isOnline == false){
                        return usersCollection.updateOne({"userName": userName}, {$set: {"isOnline": true}});
                    } else {
                        loginResult['isLogged'] = false;
                        loginResult['data'] = userName;
                        loginResult['message'] = userName + ' already logged in';
                        return new Promise((resolve, reject) => {
                            let temp = {
                                "result" : {
                                    "ok" : 1
                                }
                            }

                            resolve(temp);
                        });
                    }
                }).then(result => {
                    this._updateNames(usersCollection);
                    if(result.result.ok) {
                        socket.emit('user login result', loginResult);
                    } else {
                        throw "unidentified error";
                    }
                }).catch(error => {
                    throw error;
                });
            });
        });
    }

    _updateNames(collection) {
        return collection.find().toArray().then(allUsers => {
            let users = _.map(allUsers, user => {
                return {
                    "userName": user.userName,
                    "isOnline": user.isOnline
                }
            });

            io.sockets.emit('update users', users);
            return true;
        });
    }
}

module.exports = Server;
