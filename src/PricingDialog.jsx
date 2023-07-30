import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "./Buttons.css";
import "./PricingDialog.css";
import { db } from "./Firebase.jsx";
import { collection, query, where, getDocs, doc } from "firebase/firestore";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  import.meta.env.VITE_REACT_APP_stripePublicKey
);

export default function PricingDialog({ purchaseTypeFilter, title }) {
  const [products, setProducts] = React.useState([]);
  const [clientSecret, setClientSecret] = React.useState("");

  async function fetchPaymentCheckout(priceId, mode) {
    // Create PaymentIntent as soon as the page loads
    fetch("https://createcheckoutsession-e3gzrcyznq-ey.a.run.app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId: priceId,
        mode: mode,
      }),
    })
      .then((res) => {
        if (!res.ok && res.status !== 303) {
          throw new Error(`Server responded with a status of ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Redirect the user to the Stripe Checkout Session
        window.location.href = data.url;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  const appearance = {
    theme: "stripe",
  };
  const options = {
    clientSecret,
    appearance,
  };

  React.useEffect(() => {
    const fetchProducts = async () => {
      const productsQuery = query(
        collection(db, "products"),
        where("active", "==", true)
      );
      const querySnapshot = await getDocs(productsQuery);
      const tempProducts = {};
      for (const docSnapshot of querySnapshot.docs) {
        const priceSnap = await getDocs(
          collection(doc(db, "products", docSnapshot.id), "prices")
        );
        const purchaseType =
          priceSnap.docs[0]._document.data.value.mapValue.fields.type
            .stringValue;
        let added_credits =
          docSnapshot._document.data.value.mapValue.fields.metadata.mapValue
            .fields.credits.stringValue;
        if (purchaseType === purchaseTypeFilter) {
          tempProducts[docSnapshot.id] = docSnapshot.data();
          if (!priceSnap.empty) {
            const priceDoc = priceSnap.docs[0];
            tempProducts[docSnapshot.id].prices = {
              priceId: priceDoc.id,
              priceData: priceDoc.data(),
            };
          }
        }
      }
      setProducts(tempProducts);
    };
    fetchProducts();
  }, []);

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="transparent-button">{title}</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="PricingDialogOverlay" />
        <Dialog.Content className="PricingDialogContent">
          <Dialog.Title className="PricingDialogTitle">
            Pricing Plans
          </Dialog.Title>
          {clientSecret ? (
            <>
              <Elements options={options} stripe={stripePromise}>
                <CheckoutForm />
              </Elements>
            </>
          ) : (
            <div className="PricingTable">
              {products &&
                Object.entries(products).map(([productId, productData]) => (
                  <div className="PricingPlan" key={Math.random()}>
                    <h2 className="PlanTitle">{productData.name}</h2>
                    <p className="PlanPrice">
                      {purchaseTypeFilter === "recurring"
                        ? `$${
                            productData.prices.priceData.unit_amount / 100
                          }/mo.`
                        : `$${productData.prices.priceData.unit_amount / 100}`}
                    </p>
                    <button
                      className="solid-card-button"
                      onClick={() => {
                        if (purchaseTypeFilter === "recurring") {
                          fetchPaymentCheckout(
                            productData.prices.priceId,
                            "subscription"
                          );
                        } else if (purchaseTypeFilter === "one_time") {
                          fetchPaymentCheckout(
                            productData.prices.priceId,
                            "payment"
                          );
                        } else {
                          console.log(
                            "There has been an error with the purchase code"
                          );
                        }
                      }}
                    >
                      Subscribe
                    </button>
                  </div>
                ))}
            </div>
          )}
          <div
            style={{
              display: "flex",
              marginTop: 25,
              justifyContent: "flex-end",
            }}
          >
            <Dialog.Close asChild>
              <button className="solid-card-button">Close</button>
            </Dialog.Close>
          </div>
          <Dialog.Close asChild>
            <button className="IconButton" aria-label="Close">
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
