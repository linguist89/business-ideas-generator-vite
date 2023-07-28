import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import './Buttons.css';
import './PricingDialog.css';
import { db } from './Firebase.jsx';
import { collection, query, where, getDocs, doc, addDoc, onSnapshot } from 'firebase/firestore';
import { UserContext } from './App';
import { loadStripe } from '@stripe/stripe-js';
//https://github.com/stripe/stripe-firebase-extensions/blob/next/firestore-stripe-web-sdk/README.md
//https://www.youtube.com/watch?v=HW5roUF2RLg

export default function PricingDialog({ purchaseTypeFilter, title }) {
    const { user } = React.useContext(UserContext);
    const [products, setProducts] = React.useState([]);

    React.useEffect(() => {
        const fetchProducts = async () => {
            const productsQuery = query(collection(db, 'products'), where('active', '==', true));
            const querySnapshot = await getDocs(productsQuery);
            const tempProducts = {}
            for (const docSnapshot of querySnapshot.docs) {
                const priceSnap = await getDocs(collection(doc(db, 'products', docSnapshot.id), 'prices'));
                const purchaseType = priceSnap.docs[0]._document.data.value.mapValue.fields.type.stringValue;
                let added_credits = docSnapshot._document.data.value.mapValue.fields.metadata.mapValue.fields.credits.stringValue;
                console.log(docSnapshot);
                if (purchaseType === purchaseTypeFilter) {
                    tempProducts[docSnapshot.id] = docSnapshot.data();
                    if (!priceSnap.empty) {
                        const priceDoc = priceSnap.docs[0];
                        tempProducts[docSnapshot.id].prices = {
                            priceId: priceDoc.id,
                            priceData: priceDoc.data()
                        }
                    }
                }
            }
            setProducts(tempProducts);
        };
        fetchProducts();
    }, []);

    async function loadCheckout(priceId) {
        const docRef = await addDoc(collection(doc(db, "customers", user.uid), "checkout_sessions"), {
            price: priceId,
            success_url: window.location.origin,
            cancel_url: window.location.origin,
        });

        onSnapshot(docRef, async (snap) => {
            const { error, sessionId } = snap.data();

            if (error) {
                alert(`An error has occured: ${error.message}`);
            }

            if (sessionId) {
                const stripe = await loadStripe('pk_test_51NXCIeCr38bAPvsiuT1fMi3ViuEyflIe8cEUGULmqZofhikYJxsivM8PvQJHlx0xjjGpupbN7Zp54B0f8yryXGPK00FRWvUNXT');
                const test = await stripe.redirectToCheckout({ sessionId });
                console.log(test);
                alert(test);
            }
        });
    };

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <button className="transparent-button">{title}</button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="PricingDialogOverlay" />
                <Dialog.Content className="PricingDialogContent">
                    <Dialog.Title className="PricingDialogTitle">Pricing Plans</Dialog.Title>
                    <div className="PricingTable">
                        {products && Object.entries(products).map((([productId, productData]) => (
                            <div className="PricingPlan" key={Math.random()}>
                                <h2 className="PlanTitle">{productData.name}</h2>
                                <p className="PlanPrice">
                                    {purchaseTypeFilter === "recurring"
                                        ? `$${productData.prices.priceData.unit_amount / 100}/mo.`
                                        : `$${productData.prices.priceData.unit_amount / 100}`
                                    }
                                </p>
                                <button className="solid-card-button" onClick={() => {
                                    loadCheckout(productData.prices.priceId);
                                }}>Subscribe</button>
                            </div>
                        )))}
                    </div>
                    <div style={{ display: 'flex', marginTop: 25, justifyContent: 'flex-end' }}>
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
    )
}
