// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const { logger } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

const functions = require('firebase-functions');
const stripe = require('stripe')(process.env.VITE_REACT_APP_STRIPE_SECRET_KEY);
const cors = require('cors')({ origin: true });


const YOUR_DOMAIN = 'https://business-ideas.spsdigitaltech.com/';

exports.createCheckoutSession = onRequest(async (req, res) => {
    cors(req, res, async () => {
        const { priceId, mode } = req.body;
        if (req.method !== 'POST') {
            res.status(500).send({
                message: 'Invalid request method!'
            });
        } else {
            try {
                const session = await stripe.checkout.sessions.create({
                    line_items: [
                        {
                            price: priceId,
                            quantity: 1,
                        },
                    ],
                    mode: mode,
                    success_url: `${YOUR_DOMAIN}?success=true`,
                    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
                });
                res.status(303).send({ url: session.url });
            } catch (error) {
                console.log(error);
                res.status(500).send({ error: 'An error occurred when creating the Stripe checkout session.' });
            }
        }
    });
});

exports.addmessage = onRequest(async (req, res) => {
    // Grab the text parameter.
    const original = req.query.text;
    // Push the new message into Firestore using the Firebase Admin SDK.
    const writeResult = await getFirestore()
        .collection("messages")
        .add({ original: original });
    // Send back a message that we've successfully written the message
    res.json({ result: `Message with ID: ${writeResult.id} added.` });
});

exports.makeuppercase = onDocumentCreated("/messages/{documentId}", async (snapshot, context) => {
    const original = snapshot.data().original;
    logger.log("Uppercasing", context.params.documentId, original);
    const uppercase = original.toUpperCase();
    return snapshot.ref.set({ uppercase }, { merge: true });
});
