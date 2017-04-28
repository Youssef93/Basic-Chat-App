"use strict"

let app = require("express")();
let server = require('http').createServer(app);
let io = require('socket.io').listen(server);
let MongoClient = require('mongodb').MongoClient;

class Server {
    constructor(config) {
        this.uiDirectory = config.uiDirectory;
        this.portNumber = config.portNumber
        this.dbURL = config.dbURL;
        this.usersCollection = config.usersCollection;
        this.chatsCollections = config.chatsCollection;

        server.listen(this.portNumber);

        app.get('/', (req, res) => {
            console.log("Server Connected");
            console.log(this.uiDirectory);
            res.sendFile(this.uiDirectory);
        });

        io.on('connection', socket => {
            console.log("socket connected");
            socket.on('user login', userName => {
                MongoClient.connect(this.dbURL, function(err, db) {
                    if(err){
                        throw err;
                    }

                    console.log(db.databaseName);
                    let usersCollection = db.collection(config.usersCollection, (error, collection) => {
                        if(error){
                            throw error;
                        }

                        let x = collection.findOne({"userName": userName}, (error, result) => {
                            if(error){
                                throw error;
                            }

                            
                        });
                    });

                    db.close();
                });
            });
        });
    }
}

module.exports = Server;
