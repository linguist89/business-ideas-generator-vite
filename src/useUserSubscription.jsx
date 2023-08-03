import { useState, useEffect } from "react";
import { auth, db } from "./Firebase.jsx";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, collection } from "firebase/firestore";

export default function useUserSubscription(setUser, setCredits) {
  const [userPlan, setUserPlan] = useState("No subscription");
  const [userPlanActivity, setUserPlanActivity] = useState(false);
  const [renewalDate, setRenewalDate] = useState();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userCreditsRef = doc(
          db,
          "customers",
          currentUser.uid,
          "credits",
          "total"
        );
        const userSubscriptionRefs = await getDocs(
          collection(doc(db, "customers", currentUser.uid), "subscriptions")
        );
        if (userSubscriptionRefs.docs.length > 0) {
          const userSubscriptionRef = userSubscriptionRefs.docs[0];
          if (userSubscriptionRef.exists()) {
            let subscriptionActivity =
              userSubscriptionRef.data().items[0].plan.active;
            let subscriptionPlan =
              userSubscriptionRef.data().items[0].price.product.name;
            let subscriptionRenewalSeconds =
              userSubscriptionRef.data().current_period_end.seconds;
            let date = new Date(subscriptionRenewalSeconds * 1000);
            let formattedDate = date.toLocaleDateString();
            if (subscriptionActivity) {
              setUserPlanActivity(true);
              setRenewalDate(formattedDate);
            }
            setUserPlan(`${subscriptionPlan} plan`);
          }
        }
        getDoc(userCreditsRef).then((docSnap) => {
          if (docSnap.exists()) {
            let creditAmount = docSnap.data().amount;
            creditAmount = creditAmount < 0 ? 0 : creditAmount;
            setCredits(creditAmount);
          } else {
            setDoc(userCreditsRef, { amount: 100 }, { merge: true });
            setCredits(100);
          }
        });
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line
  }, [setUser]);

  return { userPlan, userPlanActivity, renewalDate };
}
