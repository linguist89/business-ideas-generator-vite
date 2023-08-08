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
            {purchaseTypeFilter === "recurring"
              ? "Subscription Plans"
              : "One-Time Payment Plans"}
          </Dialog.Title>
          <p>Choose a plan below</p>
          {loading ? (
            <Spinner></Spinner>
          ) : (
            <div className="PricingTable">
              {products &&
                Object.entries(products).map(([productId, productData]) => (
                  <div className="PricingPlan" key={Math.random()}>
                    <div className="PlainInfoWrapper">
                      <h2 className="PlanTitle">{productData.name}</h2>
                      <p className="PlanPrice">
                        {purchaseTypeFilter === "recurring"
                          ? `$${
                              productData.prices.priceData.unit_amount / 100
                            }/mo.`
                          : `$${
                              productData.prices.priceData.unit_amount / 100
                            }`}
                      </p>
                    </div>
                    <button
                      className="solid-card-button"
                      onClick={() => {
                        if (purchaseTypeFilter === "recurring") {
                          setLoading(true);
                          stripePayment(
                            productData.prices.priceId,
                            "subscription"
                          );
                        } else if (purchaseTypeFilter === "one_time") {
                          setLoading(true);
                          stripePayment(productData.prices.priceId, "payment");
                        } else {
                          console.log(
                            "There has been an error with the purchase code"
                          );
                        }
                      }}
                    >
                      {purchaseTypeFilter === "recurring"
                        ? "Subscribe"
                        : "Buy Now"}
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
