# Chat-App

# Notes:
    1- I have no experience in front-end development, so the front end code may not be that good.
    2- Please make sure you have a wroking mongodb driver at port 27017.
    3- There'a configuration file (config.js) in the repo. If you want to change any port number you can change it through this file without affecting the rest of the code.
    4- Node version > 6.
    5- This is a very basic chat/login app. It won't be effective against very large data.

# Instructions:
    1- Clone this repo to you computer locally. <br>
    2- Open Terminal and type
```sh
npm install
```
    3- Make sure mongoDB service is running by typing
```sh
sudo service mongodb start
```

    4- Type
```sh
node ControlUnit.js
```
    5- Go to http://localhost:[PORTNUMBER] where default port Number is 5000 unless you've changed it through config.js
    6- Enter a user name, this will view the chatting page which has two lists; first list for online contacts and the second for offline.
    7- Open another tab and go to http://localhost:[PORTNUMBER] and create another user. Now you'll see that the online users appear in both tabs.
    8- If you close the tab it'll automatically make the contact go offline and appear in the offline list.
    9- To start a chat, choose an online user and click the chat button; at which point the browser will ask the other user if he wants to chat. If he agrees you can start chatting where the messages appear on both users windows.
    10- If you close the chat and open it again you'll see the previous chat history.

# Automatic Precautions Implemented:
    1- Usernames cannot be duplicated.
    2- Existing usernames in database cannot be used while they're online.
    3- You cannot start a chat with another contact who's already in a chat with a third contact.
    4- You cannot have multiple chats at the same time.
    5- If a contact declines the chat, it's not initiated.
