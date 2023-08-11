/* eslint-disable require-jsdoc */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {Configuration, OpenAIApi} = require("openai");

admin.initializeApp();

const cors = require("cors")({origin: true});

const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);


/* function stringifySafe(obj) {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (cache.has(value)) {
        // Duplicate reference found, discard key
        return;
      }
      // Store value in our set
      cache.add(value);
    }
    return value;
  });
}*/


exports.getBusinessIdeas = functions.region("europe-west3")
    .https
    .onRequest(async (req, res) => {
      cors(req, res, async () => {
        const {focus, trends, cv} = req.body;

        const question =
        "Give me a random topic word then use" +
        "that word as the basis for the following: " +
        "I'm looking to start a business and" +
        "I need product or service ideas based on my cover letter. " +
        "I have provided a focus" +
        "(that which I want as my main purpose in the business)," +
        "trends (the current " +
        "business landscape where I live) and cover letter" +
        "(the skills and competencies that I bring to the table). " +
        "Give me product ideas, potential clients and" +
        "where to find these clients based on these factors.";

        const outputInstructions =
        "Give me 10 items and the output should" +
        "be in the following JSON format: " +
        "[{\"product\": \"product name\", \"description\":" +
        "\"product description\", \"potentialClients\": " +
        "\" at least 5 potential clients\", \"whereToFindClients\":" +
        "\" 5 places where to find clients\"}, ...]. " +
        "Do not number the items. NOTHING ELSE";

        const fullPrompt = `${question}\nFocus:` +
        `${focus}\nType: ${trends}\nCover Letter: ${cv}\n${outputInstructions}`;

        let attempts = 0;
        while (attempts < 5) {
          try {
            const completion = await openai.createChatCompletion({
              model: "gpt-3.5-turbo",
              messages: [
                {role: "system", content: "You are a knowledgeable assistant."},
                {role: "user", content: fullPrompt},
              ],
              temperature: 1,
            });

            res.status(200).send(completion.data);
            return;
          } catch (error) {
            console.error(`Attempt ${attempts + 1} failed. Error: ${error}`);
            attempts++;
          }
        }
        if (attempts === 5) {
          res.status(500).send({message: "Error after 5 attempts"});
        }
      });
    });

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
      const subId = context.params.documentId;
      // Get document that contains purchase information
      const purchaseRef = admin.firestore()
          .collection("customers")
          .doc(userId)
          .collection("subscriptions")
          .doc(subId);

      const purchaseSnapshot = await purchaseRef.get();

      // Check if the subscription is active
      const purchaseStatus = purchaseSnapshot.data().status;
      if (purchaseStatus === "active") {
      // Get the product credits information
        const productId = purchaseSnapshot.data().items[0].price.product.id;
        functions.logger.log("productId: ", productId);
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
