"use strict"

let MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

class ChatMongo {
    constructor(dbURL, usersCollection) {
        this.dbURL = dbURL;
        this.usersCollectionName = usersCollection;
        this._initialize();
    }

    getUsersCollection() {
        return this.usersCollection;
    }

    getDataBase() {
        return this.db;
    }

    getUserByUserName(userName) {
        return this.usersCollection.findOne({"userName": userName}).then(result => {
            let returnData = {};
            if(result != null){
                returnData['userFound'] = true;
                returnData['userName'] = result['userName'];
                returnData['isOnline'] = result['isOnline'];
                returnData['socketID'] = result['socketID'];
            } else {
                returnData['userFound'] = false;
            }

            return returnData;
        });
    }

    getAllUsers() {
        return this.usersCollection.find({}).toArray().then(allUsers => {
            let users = _.map(allUsers, user => {
                return {
                    "userName": user.userName,
                    "isOnline": user.isOnline,
                    "socketID": user.socketID
                }
            });

            return users;
        });
    }

    getActiveSocketID(userName) {
        return this.usersCollection.findOne({"userName": userName}).then(user => {
            return user.socketID;
        });
    }

    goOnline(userName, socketID) {
        return this.usersCollection.updateOne({"userName": userName}, {$set: {"isOnline": true , "socketID": socketID }}).then(updateResult => {
            let result = {'ok' : 1};
            updateResult['result'] = result;
            return updateResult;
        });
    }

    goOffline(userName) {
        return this.usersCollection.updateOne({"userName": userName}, {$set: {"isOnline": false, "socketID": null}});
    }

    insertNewUser(user){
        return this.usersCollection.insertOne(user);
    }

    _initialize(){
        MongoClient.connect(this.dbURL).then(db => {
            this.db = db;
            return db.collection(this.usersCollectionName);
        }).then(collection => {
            this.usersCollection = collection;
        });
    }
}

module.exports = ChatMongo;
