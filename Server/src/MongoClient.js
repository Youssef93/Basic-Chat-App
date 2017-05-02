"use strict";

let MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

class ChatMongo {
    constructor(config) {
        this.dbURL = config.dbURL;
        this.usersCollectionName = config.usersCollection;
        this.activeChatsCollectionName = config.activeChatsCollection;
        this.historyChatsCollectionName = config.historyChatsCollection;
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
        return this.activeChatsCollection.find({$or: [{"user1": user} , {"user2": user}]}).toArray().then(result => {
            if(result.length == 0)
                return false;
            else
                return true;
        });
    }

    checkSocketInChat(socketID) {
        return this.activeChatsCollection.find({$or: [{"socketID1": socketID}, {"socketID2": socketID}]}).toArray().then(result => {
            if(result.length == 0)
                return false;
            else
                return true;
        });
    }

    getChat(userName) {
        return this.activeChatsCollection.find({$or: [{"user1": userName}, {"user2": userName}]}).toArray().then(results => {
            let otherUserName, otherUserSocketID;
            let result = results[0];
            if(result.user1 == userName ) {
                otherUserName = result.user2;
                otherUserSocketID = result.socketID2;
            } else {
                otherUserName = result.user1;
                otherUserSocketID = result.socketID1;
            }
            return {
                "userName": otherUserName,
                "socketID": otherUserSocketID
            }
        });
    }

    startChat(user1, user2) {
        return this.activeChatsCollection.insertOne({
            "user1": user1.userName,
            "socketID1": user1.socketID,
            "user2": user2.userName,
            "socketID2": user2.socketID
        });
    }

    removeSocketFromChat(socketID) {
        let returnData = {};
        return this.activeChatsCollection.find({$or: [{"socketID1": socketID}, {"socketID2": socketID}]}).toArray().then(result => {
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

                return this.activeChatsCollection.deleteOne({$or : [{"socketID1": socketID}, {"socketID2": socketID}]});
            }
        }).then(result => {
            return returnData;
        });
    }

    loadChatHistory(chatHistoryName) {
        return this.historyChatsCollection.find({"chatHistoryName": chatHistoryName}).toArray().then(result => {
            if (result.length == 0) {
                return "";
            } else {
                return result[0].history;
            }
        });
    }

    saveChatHistory(chatHistoryName, history) {
        return this.historyChatsCollection.find({"chatHistoryName": chatHistoryName}).toArray().then(result => {
            if(result.length == 0) {
                return this.historyChatsCollection.insertOne({"chatHistoryName": chatHistoryName, "history": history});
            } else {
                return this.historyChatsCollection.updateOne({"chatHistoryName": chatHistoryName}, {$set: {"history": history}});
            }
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
            return temp.collection(this.activeChatsCollectionName);
        }).then(collection => {
            this.activeChatsCollection = collection;
            return true;
        }).then(result => {
            return temp.collection(this.historyChatsCollectionName);
        }).then(collection => {
            this.historyChatsCollection = collection;
        }).catch(error => {
            console.log(error);
        });
    }
}

module.exports = ChatMongo;
