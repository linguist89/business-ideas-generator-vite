const {onRequest} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");

initializeApp();

const stripe = require("stripe")(process.env.VITE_REACT_APP_STRIPE_SECRET_KEY);
const cors = require("cors")({origin: "*"});


const YOUR_DOMAIN = "https://business-ideas.spsdigitaltech.com/";

exports.createCheckoutSession = onRequest(
    {region: "europe-west3"},
    async (req, res) => {
      cors(req, res, async () => {
        const {priceId, mode} = req.body;
        if (req.method !== "POST") {
          res.status(500).send({
            message: "Invalid request method!",
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
            res.status(303).send({url: session.url});
          } catch (error) {
            console.log(error);
            res.status(500).send({
              error: "Checkout error",
            });
          }
        }
      });
    });
