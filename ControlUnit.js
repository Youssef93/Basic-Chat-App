"use strict"

let Server = require('./Server/src/Server.js');
const config = require('./config.js');

let serverInstance = new Server(config);
