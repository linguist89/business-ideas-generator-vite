import { openai } from "./OpenAI.jsx";
import { db } from "./Firebase.jsx";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";

export async function getBusinessIdeas(inputString) {
  const response = await fetch(
    `https://business-ideas.anvil.app/_/api/business_ideas`,
    {
      method: "POST",
      body: inputString,
    }
  );
  const responseJson = response.json();
  return responseJson;
}

export async function getContextInfo(product) {
  let productDict = {
    Product: product[0],
    Description: product[1],
    "Potential Clients ": product[2],
    "Where to find clients": product[3],
  };
  const response = await fetch(
    `https://business-ideas.anvil.app/_/api/business_ideas_context`,
    {
      method: "POST",
      body: JSON.stringify(productDict),
    }
  );
  const responseJson = response.json();
  return responseJson;
}

export async function getBusinessIdeasOpenAITest(focus, trends, cv) {
  console.log(focus);
  console.log(trends);
  console.log(cv);
  let question =
    "Give me a random topic word then use that word as the basis for the following: I'm looking to start a business and I need product or service ideas based on my cover letter. I have provided a focus (that which I want as my main purpose in the business), trends (the current business landscape where I live) and cover letter (the skills and competencies that I bring to the table). Give me product ideas, potential clients and where to find these clients based on these factors.";
  let output_instructions =
    'Give me 10 items and the output should be in the following JSON format: [{"product": "product name", "description": "product description", "potentialClients": " at least 5 potential clients", "whereToFindClients": " 5 places where to find clients"}, ...]. Do not number the items. NOTHING ELSE';
  let full_prompt = `${question}\nFocus: ${focus}\nType: ${trends}\nCover Letter: ${cv}\n${output_instructions}`;
  let attempts = 0;
  console.log(openai);
  while (attempts < 5) {
    try {
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a knowledgeable assistant." },
          { role: "user", content: full_prompt },
        ],
        temperature: 1,
      });
      return completion;
    } catch (error) {
      console.error(`Attempt ${attempts + 1} failed. Error: ${error}`);
      attempts++;
    } finally {
      if (attempts === 5) {
        return { message: "There has been an error after 5 attempts" };
      }
    }
  }
}

export async function getContextInfoOpenAITest(businessIdea, retryCount = 0) {
  try {
    let businessIdeaString = Object.entries(businessIdea)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
    let question =
      'From the idea above, give the outline in the following structure. The output should be a dictionary as is described below:\n{\n"Consumer Pain Point": "Biggest consumer pain points in about 3 sentences",\n"Effort": "Biggest ways to minimize the consumer\'s effort in about 3 sentences",\n"Time": "Biggest ways to minimize the time the consumer has to spend to get the product in about 3 sentences"\n}';
    let content = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a knowledgeable assistant." },
        { role: "user", content: `${question}\n${businessIdeaString}` },
      ],
      temperature: 1,
    });

    if (
      content &&
      content.data &&
      content.data.choices &&
      content.data.choices.length > 0 &&
      content.data.choices[0].message &&
      content.data.choices[0].message.content
    ) {
      let dictionaryContentRegex =
        /\{\s*"Consumer Pain Point":\s*".*?",\s*"Effort":\s*".*?",\s*"Time":\s*".*?"\s*\}/;
      let match = content.data.choices[0].message.content.match(
        dictionaryContentRegex
      );

      if (match) {
        let parsedContent = JSON.parse(match[0]);

        if (
          parsedContent &&
          typeof parsedContent === "object" &&
          parsedContent["Consumer Pain Point"] &&
          parsedContent["Effort"] &&
          parsedContent["Time"]
        ) {
          return parsedContent;
        } else {
          console.log("Parsed content: ", parsedContent);
          throw new Error(
            "Parsed content does not conform to the expected structure"
          );
        }
      } else {
        console.log("Invalid content: ", content);
        throw new Error("Content does not conform to the expected structure");
      }
    } else {
      console.log("Invalid content: ", content);
      throw new Error("Content does not conform to the expected structure");
    }
  } catch (error) {
    console.log("Error: ", error.message);
    if (retryCount < 5) {
      console.log("Retrying... Attempt number: ", retryCount + 1);
      return getContextInfoOpenAITest(businessIdea, retryCount + 1);
    } else {
      console.log("Maximum retry attempts exceeded.");
      throw error;
    }
  }
}

export async function getStartingInfoOpenAITest(product, retryCount = 0) {
  try {
    let productString = Object.entries(product)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
    let question =
      'From the idea above, give the outline in the following structure. The output should be a dictionary as is described below:\n{\n"Creating the product": "Quickest way to create it in 3 sentences",\n"Finding customers": "Quickest way to validate the market in 3 sentences",\n"Selling product": "Easiest way to sell the product to those customers in 3 sentences"\n}';
    let content = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a knowledgeable assistant." },
        { role: "user", content: `${question}\n${productString}` },
      ],
      temperature: 1,
    });

    if (
      content &&
      content.data &&
      content.data.choices &&
      content.data.choices.length > 0 &&
      content.data.choices[0].message &&
      content.data.choices[0].message.content
    ) {
      let dictionaryContentRegex =
        /\{\s*"Creating the product":\s*".*?",\s*"Finding customers":\s*".*?",\s*"Selling product":\s*".*?"\s*\}/;
      let match = content.data.choices[0].message.content.match(
        dictionaryContentRegex
      );

      if (match) {
        let parsedContent = JSON.parse(match[0]);

        if (
          parsedContent &&
          typeof parsedContent === "object" &&
          parsedContent["Creating the product"] &&
          parsedContent["Finding customers"] &&
          parsedContent["Selling product"]
        ) {
          return parsedContent;
        } else {
          console.log("Parsed content: ", parsedContent);
          throw new Error(
            "Parsed content does not conform to the expected structure"
          );
        }
      } else {
        console.log("Invalid content: ", content);
        throw new Error("Content does not conform to the expected structure");
      }
    } else {
      console.log("Invalid content: ", content);
      throw new Error("Content does not conform to the expected structure");
    }
  } catch (error) {
    console.log("Error: ", error.message);
    if (retryCount < 5) {
      console.log("Retrying... Attempt number: ", retryCount + 1);
      return getStartingInfoOpenAITest(product, retryCount + 1);
    } else {
      console.log("Maximum retry attempts exceeded.");
      throw error;
    }
  }
}

/* Save to Firebase the token usage details */
async function saveTokensToFirebase(tokens) {
  try {
    const tokensCollectionRef = collection(db, "usage");
    const newTokenDoc = await addDoc(tokensCollectionRef, tokens);
    console.log("Documents successfully written!", newTokenDoc.id);
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
  console.log(completion);
  console.log("TODO: Update Firebase with tokens used");
  const completion_data = {
    model: completion.data.model,
    //model: "gpt-3.5-turbo",
    //This needs to be fixed completion isn't the completion, but rather the results
    usage: completion.data.usage,
    timestamp: new Date(),
  };
  const newTotal =
    credits - Math.round(completion.data.usage.total_tokens / 10);
  setCredits(newTotal); // Deduct the usage from total credits

  const userCreditsRef = doc(db, "customers", user.uid, "credits", "total");
  await setDoc(userCreditsRef, { amount: newTotal }, { merge: true });
  await saveTokensToFirebase(completion_data);
}
