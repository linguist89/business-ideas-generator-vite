/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {Configuration, OpenAIApi} = require("openai");
const {SecretManagerServiceClient} = require("@google-cloud/secret-manager");
const client = new SecretManagerServiceClient();
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const express = require("express");

const app = express();

// Firestore backup
const backup = require("./backup");

const MODEL = "gpt-3.5-turbo-16k-0613";
// const MODEL = "gpt-3.5-turbo";
// const MODEL = "gpt-4";
// runs every midnight
exports.dbBackup = functions
    .region("europe-west3")
    .pubsub
// change this to preferred frequency
    .schedule("every day 00:00")
// set it to whatever timezone you prefer
    .timeZone("Europe/Berlin")
    .onRun(async (context) => {
      try {
        await backup();
      } catch (err) {
        functions.logger.error("error running db backup cron", err);
      }
    });

// Add middleware
app.use(bodyParser.raw({type: "application/json"}));

admin.initializeApp();
const cors = require("cors")({origin: true});

let openaiApiKey; // This will store the API key retrieved from Secret Manager
let openai;
let stripe;
let stripeEndpointSecret;
let stripeEndpointSecretSubscriptionUpdate;

async function getStripeSecretKey() {
  const request = {
    name: "projects/home-page-authentication/secrets/STRIPE_SECRET_KEY/versions/latest",
  };
  const response = await client.accessSecretVersion(request);
  return response[0].payload.data.toString("utf8");
}

getStripeSecretKey().then((stripeSecretKey) => {
  // Initialize Stripe with the retrieved secret key
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2022-11-15",
  });
}).catch((error) => {
  console.error("Error fetching Stripe secret key from Secret Manager:", error);
});

// Fetching the secret (Stripe Endpoint Secret) from Google Cloud Secret Manager
async function getStripeEndpointSecret() {
  const request = {
    name: "projects/home-page-authentication/secrets/STRIPE_ENDPOINT_SECRET/versions/latest",
  };
  const response = await client.accessSecretVersion(request);
  return response[0].payload.data.toString("utf8");
}

getStripeEndpointSecret().then((secret) => {
  stripeEndpointSecret = secret;
}).catch((error) => {
  console.error("Error fetching Stripe endpoint secret from Secret Manager:", error);
});

async function getStripeEndpointSecretSubscriptionUpdate() {
  const request = {
    name: "projects/home-page-authentication/secrets/STRIPE_ENDPOINT_SECRET_SUBSCRIPTION_UPDATE/versions/latest",
  };
  const response = await client.accessSecretVersion(request);
  return response[0].payload.data.toString("utf8");
}

getStripeEndpointSecretSubscriptionUpdate().then((secret) => {
  stripeEndpointSecretSubscriptionUpdate = secret;
}).catch((error) => {
  console.error("Error fetching Stripe endpoint secret from Secret Manager:", error);
});

async function getProduct(productId) {
  try {
    const product = await stripe.products.retrieve(productId);
    return product;
  } catch (error) {
    functions.logger.error("Error fetching product:", error);
    throw error;
  }
}

exports.createPortalSession = functions
    .region("europe-west3")
    .https
    .onCall(async (data, context) => {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
      }
      const firebaseUid = context.auth.uid;
      // Assuming you have saved the customerId in Firebase Firestore
      // with a document named after the Firebase UID in a collection called "stripeCustomers"
      const customerDoc = await admin.firestore().collection("customers").doc(firebaseUid).get();
      if (!customerDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Stripe customer not found for this user.");
      }
      const customerId = customerDoc.data().stripeId;

      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: "https://business-ideas.spsdigitaltech.com/",
        });

        return {url: session.url};
      } catch (error) {
        functions.logger.error("Stripe error:", error);
        throw new functions.https.HttpsError("internal", "Failed to create Stripe portal session.");
      }
    });

exports.onSubscriptionUpdate = functions
    .region("europe-west3")
    .https
    .onRequest((req, res) => {
    // Apply CORS
      cors(req, res, async () => {
        if (req.method !== "POST") {
          return res.status(405).end();
        }
        // Extract Stripe signature
        const stripeSignatureIndex = req.rawHeaders.indexOf("Stripe-Signature");
        const sig = stripeSignatureIndex !== -1 ? req.rawHeaders[stripeSignatureIndex + 1] : null;

        let event;
        try {
          event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeEndpointSecretSubscriptionUpdate);
        } catch (err) {
          functions.logger.error("Stripe signature verification failed:", err);
          return res.status(400).send(`Webhook Error: ${err}`);
        }
        const customerStripeId = event.data.object.customer;
        let productId;
        switch (event.type) {
          case "payment_intent.succeeded":
            functions.logger.log("PaymentIntent was successful!");
            break;
          case "payment_method.attached":
            const paymentMethod = event.data.object;
            functions.logger.log("PaymentMethod was attached to a Customer!");
            break;
          case "customer.subscription.updated":
            let credits;
            functions.logger.log("event", event);
            const productId = event.data.object.plan.product;
            if (productId !== undefined) {
              getProduct(productId)
                  .then(async (product) => {
                    credits = parseInt(product.metadata.credits);
                    // update customer's credits in Firestore
                    const customersRef = admin.firestore().collection("customers");
                    // Update the customer's credits in Firestore
                    customersRef.where("stripeId", "==", customerStripeId).get()
                        .then((querySnapshot) => {
                          if (!querySnapshot.empty) {
                            querySnapshot.forEach((doc) => {
                              const customerId = doc.id;
                              // Navigate to the 'credits' subcollection and then update the 'total' field
                              customersRef.doc(customerId).collection("credits").doc("total").update({
                                amount: admin.firestore.FieldValue.increment(credits),
                              });
                            });
                          } else {
                            functions.logger.error("No customer found with the given stripeId");
                          }
                        })
                        .catch((error) => {
                          functions.logger.error("Error querying data:", error);
                        });
                  })
                  .catch((error) => {
                    return res.status(500).send(`Error fetching product metadata: ${error.message}`);
                  });
            }

            break;
          default:

            break;
        }

        return res.json({received: true});
      });
    });


// Fetching the secret (OpenAI API Key) from Google Cloud Secret Manager
async function getOpenAIApiKey() {
  const request = {
    name: "projects/home-page-authentication/secrets/OPENAI_API_KEY/versions/latest",
  };
  const response = await client.accessSecretVersion(request);
  return response[0].payload.data.toString("utf8");
}

// Fetch the API key only once when the cloud function initializes
getOpenAIApiKey().then((apiKey) => {
  openaiApiKey = apiKey;
  // Initialize OpenAI with the retrieved API key
  const configuration = new Configuration({
    apiKey: openaiApiKey,
  });
  openai = new OpenAIApi(configuration);
}).catch((error) => {
  console.error("Error fetching OpenAI API key from Secret Manager:", error);
});

exports.getStartingInfo = functions
    .region("europe-west3")
    .https
    .onRequest(async (req, res) => {
      cors(req, res, async () => {
        const {productString} = req.body;
        let retryCount = req.body.retryCount || 0;
        try {
          const question =
          "From the idea above, give the outline" +
          "in the following structure. The output" +
          "should be a dictionary as is described" +
          "below:\n{\n\"Creating the product\": \"Quickest" +
          "way to create it in 6 sentences\",\n\"Finding" +
          "customers\": \"Quickest way to validate the market" +
          "in 6 sentences\",\n\"Selling product\": \"Easiest" +
          "way to sell the product to those customers in 6 sentences\"\n}";
          const content = await openai.createChatCompletion({
            model: MODEL,
            messages: [
              {role: "system", content: "You are a knowledgeable assistant."},
              {role: "user", content: `${question}\n${productString}`},
            ],
            temperature: 1,
          });
          const dictionaryHowToRegex = /\{\s*"Creating the product":\s*".*?",\s*"Finding customers":\s*".*?",\s*"Selling product":\s*".*?"\s*\}/;
          const match = content.data.choices[0].message.content.match(dictionaryHowToRegex);
          if (match) {
            const parsedContent = JSON.parse(match[0]);

            if (
              parsedContent &&
            typeof parsedContent === "object" &&
            parsedContent["Creating the product"] &&
            parsedContent["Finding customers"] &&
            parsedContent["Selling product"]
            ) {
              res.status(200).send(parsedContent);
            } else {
              functions.logger.log("Parsed content: ", parsedContent);
              throw new Error("Parsed content does not conform to the expected structure");
            }
          } else {
            functions.logger.log("Invalid content: ", content);
            throw new Error("Content does not conform to the expected structure");
          }
        } catch (error) {
          functions.logger.log("Error: ", error.message);
          if (retryCount < 5) {
            functions.logger.log("Retrying... Attempt number: ", retryCount + 1);
            retryCount++;
            req.body.retryCount = retryCount;
            exports.getStartingInfo(req, res);
          } else {
            functions.logger.log("Maximum retry attempts exceeded.");
            res.status(500).send({message: error.message});
          }
        }
      });
    });

exports.getContextInfo = functions
    .region("europe-west3")
    .https
    .onRequest(async (req, res) => {
      cors(req, res, async () => {
        const {businessIdeaString} = req.body;
        let retryCount = req.body.retryCount || 0;
        // TODO: This needs to be optmized, keys are the same, but content is different
        try {
          const question =
          "From the idea above, give the outline" +
          "in the following structure. The output" +
          "should be a dictionary as is described" +
          "below:\n{\n\"Consumer Pain Point\": \"Give the 10" +
          "biggest consumer pain points\",\n" +
          "\"Effort\": \"Give the 10 biggest ways to maximize" +
          "the value for the consumer\",\n\"Time\":" +
          "\"Give the 10 biggest ways to minimize the time the consumer has" +
          "to spend to get the product\"\n}";
          const content = await openai.createChatCompletion({
            model: MODEL,
            messages: [
              {role: "system", content: "You are a knowledgeable assistant."},
              {role: "user", content: `${question}\n${businessIdeaString}`},
            ],
            temperature: 1,
          });

          const dictionaryContentRegex = new RegExp(
              "\\{\\s*" +
          "\"Consumer Pain Point\":\\s*\".*?\",\\s*" +
          "\"Effort\":\\s*\".*?\",\\s*" +
          "\"Time\":\\s*\".*?\"\\s*" +
          "\\}",
          );

          const match = content.data.choices[0]
              .message
              .content
              .match(dictionaryContentRegex);


          if (match) {
            const parsedContent = JSON.parse(match[0]);

            if (
              parsedContent &&
            typeof parsedContent === "object" &&
            parsedContent["Consumer Pain Point"] &&
            parsedContent["Effort"] &&
            parsedContent["Time"]
            ) {
              res.status(200).send(parsedContent);
            } else {
              functions.logger.log("Parsed content: ", parsedContent);
              throw new Error(
                  "Parsed content does not conform to the expected structure",
              );
            }
          } else {
            functions.logger.log("Invalid content: ", content);
            throw new Error(
                "Content does not conform to the expected structure",
            );
          }
        } catch (error) {
          functions.logger.log("Error: ", error.message);
          if (retryCount < 5) {
            functions.logger.log("Retrying... Attempt number: ", retryCount + 1);
            retryCount++;
            // Re-run the function with an increased retryCount
            req.body.retryCount = retryCount;
            exports.getContextInfo(req, res);
          } else {
            functions.logger.log("Maximum retry attempts exceeded.");
            res.status(500).send({message: error.message});
          }
        }
      });
    });


exports.getBusinessIdeas = functions.region("europe-west3")
    .https
    .onRequest(async (req, res) => {
      cors(req, res, async () => {
        const {focus, trends, cv} = req.body;

        const question =
        "First, select a random topic word. Now, with this word as a foundation, help me brainstorm a business opportunity. To ensure it aligns with my strengths and the current market conditions, consider the following: Focus: My core intention for this business. What do I passionately want to achieve? Trends: Insights into the prevailing market trends in my region, shedding light on demand and competition. Cover Letter: A detailed overview of my skills, competencies, and experiences that I bring to this venture. Based on this, provide tailored product or service ideas that will differentiate my business. Give me product ideas, potential clients and where to find these clients based on these factors.";

        const outputInstructions =
        "Choose a random industry. Based on the above focus, type and cover letter, suggest 10 unique, thinking-outside-the-box business ideas all within the same overall industry. Present them in this JSON format: [{\"product\": \"product name\", \"description\": \"detailed and specific product description\", \"potentialClients\": \"5 potential clients\", \"whereToFindClients\": \"5 places to find clients\"}]";
        const fullPrompt = `\nFocus:` +
        `${focus}\nType: ${trends}\nCover Letter: ${cv}\n${outputInstructions}`;

        let attempts = 0;
        while (attempts < 5) {
          try {
            const completion = await openai.createChatCompletion({
              model: MODEL,
              messages: [
                {role: "system", content: "You are a knowledgeable assistant."},
                {role: "user", content: fullPrompt},
              ],
              temperature: 1,
            });

            res.status(200).send(completion.data);
            functions.logger.log("completion", completion);
            functions.logger.log("completion.data: ", completion.data);
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
        functions.logger.log("Once-off credits added of the amount: ", newTotal);

        await creditRef.set({amount: newTotal});

        functions.logger.log("Total credits successfully updated");
      }
    });
