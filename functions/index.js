const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/* exports.addPayment =
functions.region('europe-west3').https.onRequest(async (req, res) => {
    const userId = "ASDFlkajd9dsfskdA";
    const writeResult = await admin.firestore()
        .collection("customers")
        .doc(userId)
        .collection("payments")
        .add({ credits: 2000 });
    console.log("The record that was just created")
    res.json({ status: "Success!", result: writeResult });
});*/

exports.onPaymentUpdate = functions.region("europe-west3").firestore
    .document("customers/{userId}/payments/{documentId}")
    .onCreate(async (snapshot, context) => {
      // Get userID
      const userId = context.params.userId;
      const priceId = context.params.documentId;

      // Get document that contains purchase information
      const purchaseRef = admin.firestore()
          .collection("customers")
          .doc(userId)
          .collection("payments")
          .doc(priceId);

      const purchaseSnapshot = await purchaseRef.get();

      // Check if the payment succeeded
      const purchaseStatus = purchaseSnapshot.data().status;
      if (purchaseStatus === "succeeded") {
        // Get the product credits information
        const productId = purchaseSnapshot.data().items[0].price.product;
        const productRef = admin.firestore()
            .collection("products")
            .doc(productId);
        const productSnapshot = await productRef.get();
        const purchasedCredits = productSnapshot.data().stripe_metadata_credits;

        // Get user's current credits
        const creditRef = admin.firestore()
            .collection("customers")
            .doc(userId)
            .collection("credits")
            .doc("total");

        // Current credits, set to 0 if doesn't exist
        const creditSnapshot = await creditRef.get();
        let currentCredits = 0;
        if (creditSnapshot.exists) {
          currentCredits = creditSnapshot.data().amount;
        }

        // Add purchased credits to current credits and save to Firestore
        const newTotal = currentCredits + parseInt(purchasedCredits);
        functions.logger.log("New total credits: ", newTotal);

        await creditRef.set({amount: newTotal});

        functions.logger.log("Total credits successfully updated");
      }
    });

exports.onSubscriptionUpdate = functions.region("europe-west3").firestore
    .document("customers/{userId}/subscriptions/{documentId}")
    .onCreate(async (snapshot, context) => {
      // Get userID
      const userId = context.params.userId;
      const priceId = context.params.documentId;
      functions.logger.log(context);
      functions.logger.log(snapshot);
      // Get document that contains purchase information
      const purchaseRef = admin.firestore()
          .collection("customers")
          .doc(userId)
          .collection("subscriptions")
          .doc(priceId);

      const purchaseSnapshot = await purchaseRef.get();

      // Check if the subscription is active
      const purchaseStatus = purchaseSnapshot.data().status;
      if (purchaseStatus === "active") {
        // Get the product credits information
        const productId = purchaseSnapshot.data().items[0].price.id;
        const productRef = admin.firestore()
            .collection("products")
            .doc(productId);
        const productSnapshot = await productRef.get();
        const purchasedCredits = productSnapshot.data().stripe_metadata_credits;

        // Get user's current credits
        const creditRef = admin.firestore()
            .collection("customers")
            .doc(userId)
            .collection("credits")
            .doc("total");

        // Current credits, set to 0 if doesn't exist
        const creditSnapshot = await creditRef.get();
        let currentCredits = 0;
        if (creditSnapshot.exists) {
          currentCredits = creditSnapshot.data().amount;
        }

        // Add purchased credits to current credits and save to Firestore
        const newTotal = currentCredits + parseInt(purchasedCredits);
        functions.logger.log("New total credits: ", newTotal);

        await creditRef.set({amount: newTotal});

        functions.logger.log("Total credits successfully updated");
      }
    });
