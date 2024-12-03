const functions = require('firebase-functions/v1');
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore()

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started


exports.checkOut = functions.firestore
        .document("locations/{spotId}/checkins/{userId}")
        .onDelete(async (snapshot, context) => {

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
                                title: username + " just checked out",
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


