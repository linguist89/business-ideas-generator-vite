import "./BodyComponent.css";
import "./index.css";
import CustomTextarea from "./CustomTextarea";
import React from "react";
import {
  getBusinessIdeasOpenAITest,
  getContextInfoOpenAITest,
  getStartingInfoOpenAITest,
  updateFirebaseWithTokens,
} from "./HelperFunctions";
import LandingImage from "./assets/images/lighbulb_shadow.png";
import ResultsTable from "./ResultsTable";
import Spinner from "./Spinner";
import "./Buttons.css";
import { UserContext, PricingContext } from "./App";
import LoginDialog from "./LoginDialog";
import { db } from "./Firebase.jsx";
import {
  doc,
  setDoc,
  collection,
  query,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import exampleIdeas from "./exampleIdeas.json";
import DeleteIcon from "./assets/images/DeleteIcon.svg";
import { CreditContext } from "./App";

export const SelectedIdeaContext = React.createContext();

function BodyComponent() {
  const { user } = React.useContext(UserContext);
  const { credits, setCredits } = React.useContext(CreditContext);
  const { showPricingDialog, setShowPricingDialog } =
    React.useContext(PricingContext);
  const [showLoginDialog, setShowLoginDialog] = React.useState(false);
  const [focus, setFocus] = React.useState();
  const [trends, setTrends] = React.useState();
  const [cv, setCv] = React.useState();
  const [ideaResults, setIdeaResults] = React.useState([]);
  const [ideasLoading, setIdeasLoading] = React.useState(false);
  const [previousIdeas, setPreviousIdeas] = React.useState([]);
  const [selectedIdea, setSelectedIdea] = React.useState(null);

  React.useEffect(() => {
    if (user && previousIdeas.length > 0) {
      const latestIdea = previousIdeas[0];
      loadIdea(latestIdea);
    }
  }, [user, previousIdeas]);

  React.useEffect(() => {
    if (!user) {
      // check if the user is logged out
      setIdeaResults([]);
      setPreviousIdeas([]);
      setFocus(null);
      setTrends(null);
      setCv(null);
    } else {
      const fetchIdeas = async () => {
        const userIdeasRef = collection(db, "customers", user.uid, "ideas");
        const q = query(userIdeasRef);
        const querySnapshot = await getDocs(q);
        let allIdeas = [];
        querySnapshot.forEach((doc) => {
          allIdeas.push({ id: doc.id, data: doc.data() });
        });
        setPreviousIdeas(allIdeas);
      };
      fetchIdeas();
    }
  }, [user]);

  function loadIdea(ideaData) {
    setFocus(ideaData.data.focus);
    setIdeaResults(ideaData.data.ideas);
    setTrends(ideaData.data.trends);
    setCv(ideaData.data.cv);
    setSelectedIdea(ideaData.id);
  }

  async function deleteIdeaFromFirebase(ideaId) {
    const ideaRef = doc(db, "customers", user.uid, "ideas", ideaId);
    await deleteDoc(ideaRef);
  }

  const scrollToIdeasGenerator = () => {
    const element = document.getElementById("ideas-generator");
    const rect = element.getBoundingClientRect();
    window.scrollTo({
      top: rect.top - 120,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  async function saveIdeasToFirebase(searchData) {
    try {
      const userIdeasRef = collection(db, "customers", user.uid, "ideas");
      const newIdeaDoc = doc(userIdeasRef);
      await setDoc(newIdeaDoc, searchData);
      console.log("Documents successfully written!");
      return newIdeaDoc.id;
    } catch (error) {
      console.error("Error writing documents: ", error);
    }
  }

  async function addContextInfoToIdeas(parsedResponse) {
    // Loop through all ideas in the parsed response.
    for (let i = 0; i < parsedResponse.length; i++) {
      // For each idea, get the additional context information.
      let additionalInfo;
      try {
        additionalInfo = await getContextInfoOpenAITest(parsedResponse[i]);
      } catch (error) {
        console.log(
          "Error in getContextInfoOpenAITest, idea index: ",
          i,
          ", Error: ",
          error.message
        );
        continue;
      }
      // Add the additional context information to the idea.
      parsedResponse[i] = {
        ...parsedResponse[i],
        "Consumer Pain Point": additionalInfo["Consumer Pain Point"],
        Effort: additionalInfo["Effort"],
        Time: additionalInfo["Time"],
      };
    }
    // Return the updated parsed response.
    return parsedResponse;
  }

  async function addStartingInfoToIdeas(parsedResponse) {
    // Loop through all ideas in the parsed response.
    for (let i = 0; i < parsedResponse.length; i++) {
      // For each idea, get the additional context information.
      let additionalInfo;
      try {
        additionalInfo = await getStartingInfoOpenAITest(parsedResponse[i]);
      } catch (error) {
        console.log(
          "Error in getStartingInfoOpenAITest, idea index: ",
          i,
          ", Error: ",
          error.message
        );
        continue;
      }
      // Add the additional context information to the idea.
      parsedResponse[i] = {
        ...parsedResponse[i],
        // Add the starting info to the idea.
        "Creating the product": additionalInfo["Creating the product"],
        "Finding customers": additionalInfo["Finding customers"],
        "Selling product": additionalInfo["Selling product"],
      };
    }
    // Return the updated parsed response.
    return parsedResponse;
  }

  function checkCreditAmount() {
    if (credits <= 0) {
      alert("Buy more credits to generate more ideas");
      return false;
    }
    return true;
  }

  async function businessIdeasOpenAITest() {
    // Validate that the user has more than 0 credits.
    if (!checkCreditAmount()) {
      return;
    }

    let startTime = performance.now();
    if (!user) {
      setShowLoginDialog(true);
    } else {
      setIdeasLoading(true);
      setIdeaResults([]);
      scrollToBottom();
      let checkedFocus = focus ? focus : "Random product or service";
      let checkedTrends = trends ? trends : "Any customer";
      let checkedCv = cv ? cv : "Various skills";

      let results;
      let parsedResponse;
      try {
        results = await getBusinessIdeasOpenAITest(
          checkedFocus,
          checkedTrends,
          checkedCv
        );
        await updateFirebaseWithTokens(results, credits, setCredits, user);

        let response = results.data.choices[0].message.content;
        parsedResponse = JSON.parse(response);
        console.log("parsedResponse: ", parsedResponse);
        // Call addContextInfoToIdeas to add additional information to each idea
        //parsedResponse = await addContextInfoToIdeas(parsedResponse);

        // Call addStartingInfoToIdeas to add additional information to each idea
        //parsedResponse = await addStartingInfoToIdeas(parsedResponse);

        // Add empty context info and starting info to each idea
        parsedResponse = parsedResponse.map((idea) => {
          return {
            ...idea,
            "Consumer Pain Point": "",
            Effort: "",
            Time: "",
            "Creating the product": "",
            "Finding customers": "",
            "Selling product": "",
          };
        });

        console.log("parsedResponse: ", parsedResponse);
      } catch (error) {
        console.log(
          "Error in getBusinessIdeasOpenAITest or getContextInfoOpenAITest or getStartingInfoOpenAITest: ",
          error.message
        );
      }

      setIdeaResults(parsedResponse);
      const newIdeaID = await saveIdeasToFirebase({
        focus: checkedFocus,
        trends: checkedTrends,
        cv: checkedCv,
        ideas: parsedResponse,
      });
      setIdeasLoading(false);
      setSelectedIdea(newIdeaID);
      setPreviousIdeas((prevIdeas) => [
        {
          id: newIdeaID,
          data: {
            focus: checkedFocus,
            trends: checkedTrends,
            cv: checkedCv,
            ideas: parsedResponse,
          },
        },
        ...prevIdeas,
      ]);
    }
    let endTime = performance.now();
    console.log(
      `Call to generate business ideas took ${endTime - startTime} milliseconds`
    );
  }

  return (
    <>
      <LoginDialog
        open={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
      />
      <div className="body-component">
        <div className="left-section">
          <h1 className="title">Business Ideas</h1>
          <h2 className="subtitle">
            Generating the ideas, so you can build them without wasting time
          </h2>
          <div className="button-group">
            <button className="solid-button" onClick={scrollToIdeasGenerator}>
              Let's get ideas
            </button>
          </div>
        </div>
        <div className="right-section">
          <img src={LandingImage} alt="Custom" className="custom-image" />
        </div>
      </div>
      <>
        <div id="ideas-generator">
          <div className="previous-items-section">
            <h1 className="previous-items-title">
              {user ? "Previously generated ideas" : "Check example ideas"}
            </h1>
            {user && previousIdeas && previousIdeas.length > 0 ? (
              previousIdeas.map((idea, index) => (
                <div key={index} className="idea-item">
                  <button
                    disabled={ideasLoading}
                    className={`ListButtonAlignment button-link ${
                      idea.id === selectedIdea ? "selected-idea" : ""
                    }`}
                    onClick={() => loadIdea(idea)}
                  >
                    {idea.data.focus}
                  </button>
                  <button
                    disabled={ideasLoading}
                    className="DeleteButton"
                    onClick={() => {
                      deleteIdeaFromFirebase(idea.id);
                      setPreviousIdeas(
                        previousIdeas.filter((i) => i.id !== idea.id)
                      );
                    }}
                  >
                    <img src={DeleteIcon} alt="Delete Icon"></img>
                  </button>
                </div>
              ))
            ) : user ? (
              <p className="TextTopPadding">
                You have no previously saved ideas
              </p>
            ) : (
              <ul className="IdeaExamplesWrapper">
                {exampleIdeas.map((exampleIdea, index) => (
                  <li key={index}>
                    <button
                      className="button-link"
                      onClick={() => loadIdea({ data: exampleIdea })}
                    >
                      {exampleIdea.focus}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="generate-section" disabled={ideasLoading}>
            <h1 className="previous-items-title">Generate new ideas</h1>
            <div className="TextareaWrapper">
              <CustomTextarea
                instructions="What do you want to do?"
                placeholder="What do you want to do? (Leave blank for random ideas)"
                infoSetter={setFocus}
                value={focus ? focus : ""}
              ></CustomTextarea>
              <CustomTextarea
                instructions="What type of people are you hoping to sell to?"
                placeholder="What type of people are you hoping to sell to? (Leave blank for random ideas)"
                infoSetter={setTrends}
                value={trends ? trends : ""}
              ></CustomTextarea>
              <CustomTextarea
                instructions="What are the 3 or 4 skills you want to focus on?"
                placeholder="What are the 3 or 4 skills you want to focus on? (Leave blank for random ideas)"
                infoSetter={setCv}
                value={cv ? cv : ""}
              ></CustomTextarea>
            </div>
            <div className="BodyComponentButtonDiv">
              <button
                className="solid-card-button"
                onClick={businessIdeasOpenAITest}
                disabled={ideasLoading}
              >
                {ideasLoading ? "Generating..." : "Generate Business Ideas"}
              </button>
            </div>
          </div>
        </div>
        <div className="table-section">
          {ideaResults.length > 0 ? (
            <SelectedIdeaContext.Provider
              value={{ selectedIdea, setSelectedIdea }}
            >
              <ResultsTable
                key="ResultsTable"
                products={ideaResults}
                setProducts={setIdeaResults}
                title={focus}
                setShowLoginDialog={setShowLoginDialog}
              />
            </SelectedIdeaContext.Provider>
          ) : (
            ideasLoading && <Spinner></Spinner>
          )}
        </div>
      </>
    </>
  );
}

export default BodyComponent;
