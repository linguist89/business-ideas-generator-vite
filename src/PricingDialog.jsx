import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "./Buttons.css";
import "./PricingDialog.css";
import { db } from "./Firebase.jsx";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { UserContext } from "./App";
import Spinner from "./Spinner";
import PricingImage from "./assets/images/gold_coins_120_120.png";
import { createPortalSessionFunction } from "./Firebase.jsx";

export default function PricingDialog({
  open,
  onClose,
  purchaseTypeFilter,
  title,
}) {
  const [products, setProducts] = React.useState([]);
  const { user } = React.useContext(UserContext);
  const [unsubscribe, setUnsubscribe] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [hasSubscription, setHasSubscription] = React.useState(false);
  const [activeSubscriptionId, setActiveSubscriptionId] = React.useState(null);

  function callFirebaseFunction() {
    setLoading(true); // Show spinner
    createPortalSessionFunction()
      .then((result) => {
        const url = result.data.url;
        window.location.assign(url);
      })
      .catch((error) => {
        console.error("Error calling cloud function:", error);
      })
      .finally(() => {
        setLoading(false); // Hide spinner
      });
  }

  async function stripePayment(priceId, mode) {
    let data = {
      price: priceId,
      success_url: window.location.origin,
      cancel_url: window.location.origin,
      mode: mode,
    };
    const docRef = await addDoc(
      collection(db, "customers", user.uid, "checkout_sessions"),
      data
    );

    const unsubscribeSnapshot = onSnapshot(docRef, (doc) => {
      const { error, url } = doc.data();
      if (error) {
        alert(`An error occured: ${error.message}`);
      }
      if (url) {
        window.location.assign(url);
        unsubscribeSnapshot();
      }
    });

    setUnsubscribe(() => unsubscribeSnapshot);
  }

  React.useEffect(() => {
    const fetchSubscription = async () => {
      const subscriptionQuery = collection(
        db,
        "customers",
        user.uid,
        "subscriptions"
      );
      const subscriptionSnapshot = await getDocs(subscriptionQuery);
      if (!subscriptionSnapshot.empty) {
        setHasSubscription(true);
        const userSubscriptionProductId =
          subscriptionSnapshot.docs[0].data().items[0].price.product.id;
        if (userSubscriptionProductId) {
          setActiveSubscriptionId(userSubscriptionProductId);
        }
      }
    };
    if (user) {
      fetchSubscription();
    }
  }, [user, activeSubscriptionId]);

  React.useEffect(() => {
    if (user) {
      onClose(false);
    }
  }, [user, onClose]);

  // Cleanup when the component unmounts
  React.useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  React.useEffect(() => {
    const fetchProducts = async () => {
      const productsQuery = query(
        collection(db, "products"),
        where("active", "==", true)
      );
      const querySnapshot = await getDocs(productsQuery);
      const tempProducts = []; // Changed to an array

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
          const productData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          };
          if (!priceSnap.empty) {
            const priceDoc = priceSnap.docs[0];
            productData.prices = {
              priceId: priceDoc.id,
              priceData: priceDoc.data(),
            };
          }
          tempProducts.push(productData);
        }
      }

      // Sort tempProducts array by price
      tempProducts.sort((a, b) => {
        if (a.prices && b.prices) {
          return (
            a.prices.priceData.unit_amount - b.prices.priceData.unit_amount
          );
        }
        return 0; // Return as equal if no prices available for comparison
      });

      // Convert back to object if needed
      const sortedProducts = {};
      tempProducts.forEach((product) => {
        sortedProducts[product.id] = product;
      });

      setProducts(sortedProducts);
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
            {purchaseTypeFilter === "recurring"
              ? "Subscription Plans"
              : "One-Time Payment Plans"}
          </Dialog.Title>
          <p></p>
          {loading ? (
            <Spinner></Spinner>
          ) : (
            <div className="PricingTable">
              {products &&
                Object.entries(products).map(([productId, productData]) => {
                  // Check if the user does not have a subscription or if they have this specific subscription
                  if (
                    purchaseTypeFilter === "one_time" ||
                    !hasSubscription ||
                    productId
                  ) {
                    return (
                      <div className="PricingPlan" key={Math.random()}>
                        {" "}
                        <div className="PlainInfoWrapper">
                          <h2 className="PlanTitle">{productData.name}</h2>
                          <h3 className="PlanDescription">
                            {productData.description}
                          </h3>
                          <p className="PlanPrice">
                            {purchaseTypeFilter === "recurring"
                              ? `$${
                                  productData.prices.priceData.unit_amount / 100
                                }/mo.`
                              : `$${
                                  productData.prices.priceData.unit_amount / 100
                                }`}
                          </p>
                          <img src={PricingImage} alt="Pricing Image"></img>
                        </div>
                        <button
                          className="solid-card-button"
                          onClick={() => {
                            if (purchaseTypeFilter === "recurring") {
                              if (hasSubscription) {
                                callFirebaseFunction();
                              } else {
                                setLoading(true);
                                stripePayment(
                                  productData.prices.priceId,
                                  "subscription"
                                );
                              }
                            } else if (purchaseTypeFilter === "one_time") {
                              setLoading(true);
                              stripePayment(
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
                          {purchaseTypeFilter === "recurring"
                            ? hasSubscription
                              ? productId === activeSubscriptionId
                                ? "Manage Current Subscription"
                                : `Switch to ${productData.name}`
                              : "Subscribe"
                            : "Buy Now"}
                        </button>
                      </div>
                    );
                  }
                  return null; // If user has an active subscription and this is not the one, don't render it.
                })}
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
