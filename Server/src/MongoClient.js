"use strict"

let MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

class ChatMongo {
    constructor(dbURL, usersCollection, chatCollection) {
        this.dbURL = dbURL;
        this.usersCollectionName = usersCollection;
        this.chatsCollectionName = chatCollection;
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
        return this.usersCollection.updateOne({"userName": userName},{$set: {"isOnline": false, "socketID": null}});
    }

    insertNewUser(user) {
        return this.usersCollection.insertOne(user);
    }

    checkUserInChat(user) {
        return this.chatsCollection.find({$or: [{"user1": user} , {"user2": user}]}).toArray().then(result => {
            if(result.length == 0)
                return false;
            else
                return true;
        });
    }

    checkSocketInChat(socketID) {
        return this.chatsCollection.find({$or: [{"socketID1": socketID}, {"socketID2": socketID}]}).toArray().then(result => {
            if(result.length == 0)
                return false;
            else
                return true;
        });
    }

    startChat(user1, user2) {
        return this.chatsCollection.insertOne({
            "user1": user1.userName,
            "socketID1": user1.socketID,
            "user2": user2.userName,
            "socketID2": user2.socketID
        });
    }

    removeSocketFromChat(socketID) {
        let returnData = {};
        return this.chatsCollection.find({$or: [{"socketID1": socketID}, {"socketID2": socketID}]}).toArray().then(result => {
            if(result.length == 0) {
                returnData['isFound'] = false;
                return true;
            } else {
                returnData['isFound'] = true;
                if(result[0]['socketID1'] == socketID) {
                    returnData['otherUserName'] = result[0]['user2'];
                    returnData['otherUserSocketID'] = result[0]['socketID2'];
                } else {
                    returnData['otherUserName'] = result[0]['user1'];
                    returnData['otherUserSocketID'] = result[0]['socketID1'];
                }

                return this.chatsCollection.deleteOne({$or : [{"socketID1": socketID}, {"socketID2": socketID}]});
            }
        }).then(result => {
            return returnData;
        });
    }

    _initialize() {
        let temp;
        MongoClient.connect(this.dbURL).then(db => {
            this.db = db;
            temp = db;
            return db.collection(this.usersCollectionName);
        }).then(collection => {
            this.usersCollection = collection;
            return true;
        }).then(result => {
            return temp.collection(this.chatsCollectionName);
        }).then(collection => {
            this.chatsCollection = collection;
        });
    }
}

module.exports = ChatMongo;
