import { db } from "./Firebase.jsx";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";

/* Save to Firebase the token usage details */
async function saveTokensToFirebase(tokens) {
  try {
    const tokensCollectionRef = collection(db, "usage");
    const newTokenDoc = await addDoc(tokensCollectionRef, tokens);
  } catch (error) {
    console.error("Error writing documents: ", error);
  }
}

// Function to update Firebase Firestore with used tokens
export async function updateFirebaseWithTokens(
  completion,
  credits,
  setCredits,
  user
) {
  const completion_data = {
    model: completion.model,
    usage: completion.usage,
    timestamp: new Date(),
  };
  const newTotal = credits - Math.round(completion.usage.total_tokens / 40);
  if (newTotal < 0) {
    newTotal = 0;
  }
  setCredits(newTotal);

  const userCreditsRef = doc(db, "customers", user.uid, "credits", "total");
  await setDoc(userCreditsRef, { amount: newTotal }, { merge: true });
  await saveTokensToFirebase(completion_data);
}
