// Import necessary modules
const { Configuration, OpenAIApi } = require("openai");

// Configure OpenAI
const configuration = new Configuration({
    apiKey: import.meta.env.VITE_REACT_APP_Open_AI_api_key,  // Use process.env for Netlify
});
const openai = new OpenAIApi(configuration);

export async function handler(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { focus, trends, cv } = JSON.parse(event.body);

    let question = "Give me a random topic word then use that word as the basis for the following: I'm looking to start a business and I need product or service ideas based on my cover letter. I have provided a focus (that which I want as my main purpose in the business), trends (the current business landscape where I live) and cover letter (the skills and competencies that I bring to the table). Give me product ideas, potential clients and where to find these clients based on these factors.";
    let output_instructions = 'Give me 10 items and the output should be in the following JSON format: [{"product": "product name", "description": "product description", "potentialClients": " at least 5 potential clients", "whereToFindClients": " 5 places where to find clients"}, ...]. Do not number the items. NOTHING ELSE';
    let full_prompt = `${question}\nFocus: ${focus}\nType: ${trends}\nCover Letter: ${cv}\n${output_instructions}`;

    let attempts = 0;

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

            // Note: Depending on the response structure of OpenAI, you might need to parse the data or handle it accordingly before sending it back.

            return {
                statusCode: 200,
                body: JSON.stringify(completion)
            };
        } catch (error) {
            console.error(`Attempt ${attempts + 1} failed. Error: ${error}`);
            attempts++;
        } finally {
            if (attempts === 5) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({ message: "There has been an error after 5 attempts" })
                };
            }
        }
    }
};
