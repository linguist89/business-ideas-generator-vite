import express from 'express';
import { Stripe } from 'stripe';
import cors from 'cors';  // Import cors module

const app = express();

// Allow all CORS requests
app.use(cors());

// Enable pre-flight across-the-board
app.options('*', cors());

const stripe = new Stripe('sk_test_51NXCIeCr38bAPvsigkurAhFFufPBFaHChdiAGawyIpeJCiTHOAZ57L3RppVHIv4eoT2wg5WF27vjbSSfKBgtP6g100zcGknJu3');

app.use(express.static("public"));
app.use(express.json());

const calculateOrderAmount = (items) => {
    return 1400;
};

app.post('/create-checkout-session', async (req, res) => {
    const YOUR_DOMAIN = 'http://localhost:5173';  // Replace with your domain
    const { priceId } = req.body;

    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${YOUR_DOMAIN}?success=true`,
        cancel_url: `${YOUR_DOMAIN}?canceled=true`,
    });

    res.json({ url: session.url });
});



app.post("/create-payment-intent", async (req, res) => {
    const { items } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
        amount: calculateOrderAmount(items),
        currency: "usd",
        automatic_payment_methods: {
            enabled: true,
        },
    });

    res.send({
        clientSecret: paymentIntent.client_secret,
    });
});

app.listen(4242, () => console.log("Node server listening on port 4242!"));
