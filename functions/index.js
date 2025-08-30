const functions = require('firebase-functions/v1');
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore()

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.qrRedirect = functions.https.onRequest((req, res) => {
    const pathParts = req.path.split("/");
    const spotId = pathParts[pathParts.length - 1];

    if (!spotId) {
        return res.status(400).send("Missing Spot ID");
    }

    const userAgent = req.get("user-agent") || "";
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);


    // Replace these with your actual store URLs
    const appStoreURL = "https://apps.apple.com/us/app/cityxcape/id6741536918";
    const playStoreURL = "https://play.google.com/store/apps/details?id=com.cityxcape.app";
    const fallbackURL = "https://cityxcape.com/download";


    const redirectTo = isIOS
        ? appStoreURL
        : isAndroid
        ? playStoreURL
        : fallbackURL;


    return res.redirect(302, redirectTo);
   
})


exports.missionComplete = functions.firestore
        .document("locations/{spotId}/checkIns/{userId}")
        .onCreate(async (snapshot, context) => {

            const userId = context.params.userId;
            const data = snapshot.data();

            const username = data.username || "Someone";
            const imageUrl = data.imageUrl || "";
            const missionName = data.missionName || "a mission"
            const claimNumber = data.claimNumber || "unknown"

            const fcmToken =  'fC1zwpY7lUZxo60lmqpPG9:APA91bHsucUiFq9iRx_ZEn0tkThRpO6J9-08oL4SRTqgR9dm53qPGyth477413dKljMsdrEpENWWlZ9zgH8IhDCsgO50bLrKuzed6QxJwP-dxXmRkiXkDKc'
            const message = {
                notification: {
                    title: `${username} claimed position #${claimNumber}`,
                    body: `${missionName}`,
                },
                data: {
                    uid: userId,
                    imageUrl: imageUrl,
                    username: username
                },
                token: fcmToken
            };

            await admin.messaging().send(message);

        })

exports.newSale = functions.firestore
        .document("locations/{spotId}/sales/{documentId}")
        .onCreate(async (snapshot, context) => {

            const data = snapshot.data();
            const commission = data.commission.toFixed(2);
            const artifactName = data.name;
            const userId = data.userId;
            
            const fcmToken =  'fC1zwpY7lUZxo60lmqpPG9:APA91bHsucUiFq9iRx_ZEn0tkThRpO6J9-08oL4SRTqgR9dm53qPGyth477413dKljMsdrEpENWWlZ9zgH8IhDCsgO50bLrKuzed6QxJwP-dxXmRkiXkDKc'

            const message = {
                notification: {
                    title: `New Sale: ${artifactName}`,
                    body: `You've made $${commission}`,
                },
                data: {
                    title: userId,
                },
                token: fcmToken
            };

            await admin.messaging().send(message);


        })



exports.newMission = functions.firestore
        .document("missions/{missionId}")
        .onCreate(async (snapshot, context) => {

            const missionId = context.params.missionId;
            const data = snapshot.data();

            const missionName = data.name;
            const reward = data.streetcred;

            const users = await db.collection('users').get()

            for (const doc of users.docs) {
                const data = doc.data()
                const fcmToken = data.fcmToken;

                if (!fcmToken) {
                    console.log(`User ${doc.id} has no FCM toke`);
                    continue
                }

                var payload = {
                    notification: {
                        title: "New Mission: " + missionName,
                        body: "Bounty: " + reward
                    },
                    data: {
                        missionId: missionId
                    },
                    token: fcmToken
                };

                try {
                    await admin.messaging().send(payload);
                    console.log(`Notification sent to ${doc.id}`);
                } catch (error) {
                    console.error(`Error sending to ${doc.id}`, error);
                }
            }

        })

        // exports.newRequest = functions.firestore
//         .document("users/{ownerId}/requests/{userId}")
//         .onCreate(async (snapshot, context) => {
            
//             const senderId = context.params.userId;
//             const ownerId = context.params.ownerId;
//             const data = snapshot.data();
//             const username = data.username;
//             const owner = await db.collection('users').doc(ownerId).get();

//             const ownerData = owner.data();
//             const fcmToken = ownerData.fcmToken;


//             const message = {
//                 notification: {
//                     title: "New Request",
//                     body: username + " wants to connect with you",
//                 },
//                 data: {
//                     title: senderId,
//                 },
//                 token: fcmToken
//             };

//             await admin.messaging().send(message);

//         })




// exports.newSocialCheckin = functions.firestore
//         .document("/locations/{spotId}/checkins/{userId}")
//         .onCreate(async (snapshot, context) => {

//             const spotId = context.params.spotId;
//             const userId = context.params.userId;
//             const username = snapshot.data().username;

//             const users = await db.collection('locations')
//                                   .doc(spotId)
//                                   .collection('checkins')
//                                   .get()

            
//             users.forEach(async (document) => {
//                 var fcmToken = ""
//                 let data = document.data()
//                 const id = data.id;
               
//                 const spotName = data.city;
//                 fcmToken = data.fcmToken;
//                 if (id == userId) {
//                     fcmToken = ""
//                 }

//                 const message = {
//                             notification: {
//                                 title: username + " just checked in",
//                                 body: spotName,
//                             },
//                             data: {
//                                 title: userId,
//                             },
//                             token: fcmToken
//                         };

    
//                 await admin.messaging().send(message);
//             })

            
//         })



// exports.newMessage = functions.firestore
//         .document("messages/recentMessage/{toId}/{fromId}")
//         .onCreate(async (snapshot, context) => {

//             const toId = context.params.toId;
//             const fromId = context.params.fromId;
//             const data = snapshot.data();

//             const content = data.content;
//             const username = data.username;

//             const owner = await db.collection('users').doc(toId).get();
//             const fcmToken = owner.data().fcmToken;


//             const message = {
//                 notification: {
//                     title: username,
//                     body: content,
//                 },
//                 data: {
//                     title: fromId,
//                 },
//                 token: fcmToken
//             };

//             await admin.messaging().send(message);

//         })
