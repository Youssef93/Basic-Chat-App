"use strict"

let Server = require('./Server/src/Server.js');
let MongoClient = require('./Server/src/MongoClient.js');
const config = require('./config.js');

let chatMongoClient = new MongoClient(config.dbURL, config.usersCollection);
let serverInstance = new Server(config, chatMongoClient);
