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

        server.listen(this.portNumber);

        app.get('/', (req, res) => {
            console.log("Server Connected");
            console.log(this.uiDirectory);
            res.sendFile(this.uiDirectory);
        });

        io.on('connection', socket => {
            returnData = {};
            console.log("socket connected");

            socket.on('user login', userData => {
                MongoClient.connect(this.dbURL, (error, db => {
                    console.log("data base connected");
                    socket.emit('validation', true);
                }));
            });
        });
    }
}

module.exports = Server;
