const functions = require('firebase-functions/v1');
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore()

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started


exports.newRequest = functions.firestore
        .document("users/{ownerId}/requests/{userId}")
        .onCreate(async (snapshot, context) => {
            
            const senderId = context.params.userId;
            const ownerId = context.params.ownerId;
            const data = snapshot.data();
            const username = data.username;
            const owner = await db.collection('users').doc(ownerId).get();

            const ownerData = owner.data();
            const fcmToken = ownerData.fcmToken;


            const message = {
                notification: {
                    title: "New Request",
                    body: username + " wants to connect with you",
                },
                data: {
                    title: senderId,
                },
                token: fcmToken
            };

            await admin.messaging().send(message);

        })



exports.newSale = functions.firestore
        .document("locations/{spotId}/sales/{documentId}")
        .onCreate(async (snapshot, context) => {

            const spotId = context.params.spotId;
            const data = snapshot.data();
            const username = data.username;
            const streetcred = data.streetcred;
            const amount = streetcred * 0.15
            const userId = data.id;
            
            const spot = await db.collection('locations').doc(spotId).get();
            const fcmToken = spot.data().ownerFcm;
            const spotName = spot.data().name;

            const message = {
                notification: {
                    title: "New Sale at " + spotName,
                    body: "You've made $" + amount,
                },
                data: {
                    title: userId,
                },
                token: fcmToken
            };

            await admin.messaging().send(message);


        })

exports.newStamp = functions.firestore
        .document("locations/{spotId}/stamps/{userId}")
        .onCreate(async (snapshot, context) => {

            const userId = context.params.userId;
            const data = snapshot.data();
            const username = data.username;
            const ownerId = data.ownerId;
            const spotName = data.spotName;

            const owner = await db.collection('users').doc(ownerId).get();
            const ownerData = owner.data();
            const fcmToken = ownerData.fcmToken;

            const message = {
                notification: {
                    title: "Someone Found Your Spot",
                    body: username + " checked in " + spotName,
                },
                data: {
                    title: userId,
                },
                token: fcmToken
            };

            await admin.messaging().send(message);

        })

exports.newMessage = functions.firestore
        .document("messages/recentMessage/{toId}/{fromId}")
        .onCreate(async (snapshot, context) => {

            const toId = context.params.toId;
            const fromId = context.params.fromId;
            const data = snapshot.data();

            const content = data.content;
            const username = data.username;

            const owner = await db.collection('users').doc(toId).get();
            const fcmToken = owner.data().fcmToken;


            const message = {
                notification: {
                    title: username,
                    body: content,
                },
                data: {
                    title: fromId,
                },
                token: fcmToken
            };

            await admin.messaging().send(message);

        })

exports.newCheckin = functions.firestore
        .document("/locations/{spotId}/checkins/{userId}")
        .onCreate(async (snapshot, context) => {

            const spotId = context.params.spotId;
            const userId = context.params.userId;
            const username = snapshot.data().username;

            const users = await db.collection('locations')
                                  .doc(spotId)
                                  .collection('checkins')
                                  .get()

            users.forEach(async (document) => {
                
                let data = document.data()
                const spotName = data.city;
                const fcmToken = data.fcmToken;

                const message = {
                            notification: {
                                title: username + " just checked in",
                                body: spotName,
                            },
                            data: {
                                title: userId,
                            },
                            token: fcmToken
                        };

    
                await admin.messaging().send(message);
            })

            
        })


