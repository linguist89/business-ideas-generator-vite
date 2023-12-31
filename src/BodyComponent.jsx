import "./BodyComponent.css";
import "./index.css";
import CustomTextarea from "./CustomTextarea";
import React from "react";
import {
  updateFirebaseWithTokens,
  logErrorToFirestore,
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
import { CreditContext } from "./App";
import {
  getAuth,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import ConfirmationDelete from "./ConfirmationDelete";
import InfoDialog from "./InfoDialog";
import howToGuide from "./HowToGuide.json";
import { delay } from "./HelperFunctions";

export const SelectedIdeaContext = React.createContext();

function BodyComponent() {
  const { user, setUser } = React.useContext(UserContext);
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
  const [selectedIdeaIndex, setSelectedIdeaIndex] = React.useState(0);
  const auth = getAuth();

  React.useEffect(() => {
    if (!user) {
      console.log("TODO - fix example ideas");
      const exampleIdea = exampleIdeas[0];
      loadIdea({ data: exampleIdea, id: 0 });
    }
  }, [user]);

  React.useEffect(() => {
    if (user && previousIdeas.length > 0) {
      const latestIdea = previousIdeas[0];
      loadIdea(latestIdea);
    }
  }, [user, previousIdeas]);

  React.useEffect(() => {
    const performSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        const emailFromStorage = window.localStorage.getItem("emailForSignIn");
        if (emailFromStorage) {
          try {
            const result = await signInWithEmailLink(
              auth,
              emailFromStorage,
              window.location.href
            );
            setUser(result.user);
            window.localStorage.removeItem("emailForSignIn");
          } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            setErrorMessage(
              `Error code: ${errorCode}, Error message: ${errorMessage}`
            );
          }
        }
      }
    };
    performSignIn();
  }, [auth, setUser]);

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
        allIdeas.sort((a, b) => {
          return b.data.timestamp - a.data.timestamp;
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
  const scrollToBottom = () => {
    console.log("TODO: scroll to bottom");
  };

  async function saveIdeasToFirebase(searchData) {
    try {
      const userIdeasRef = collection(db, "customers", user.uid, "ideas");
      const newIdeaDoc = doc(userIdeasRef);
      await setDoc(newIdeaDoc, {
        ...searchData,
        timestamp: new Date(),
      });
      return newIdeaDoc.id;
    } catch (error) {
      await logErrorToFirestore(
        `Error writing documents: ${error} ${JSON.stringify(searchData)}`
      );
    }
  }

  function checkCreditAmount() {
    if (credits <= 0) {
      alert("Buy more credits to generate more ideas");
      return false;
    }
    return true;
  }

  async function getBusinessIdeas(focus, trends, cv) {
    console.log("Getting business ideas");
    try {
      const response = await fetch(
        "https://europe-west3-home-page-authentication.cloudfunctions.net/getBusinessIdeas",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ focus, trends, cv }),
        }
      );
      console.log("Getting business ideas response", response);
      if (!response.ok) {
        setIdeasLoading(false);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      await logErrorToFirestore(`Fetch error: ${error}`);
    }
  }

  async function businessIdeasClick() {
    if (!user) {
      setShowLoginDialog(true);
    } else {
      if (user.emailVerified === false) {
        alert("Please verify your email");
        return;
      }
      if (!checkCreditAmount()) {
        return;
      }

      setIdeasLoading(true);
      setIdeaResults([]);
      scrollToBottom();

      let checkedFocus = focus ? focus : "A single Random product or service";
      let checkedTrends = trends ? trends : "Any customer";
      let checkedCv = cv ? cv : "Various skills";

      let results;
      let parsedResponse;

      try {
        results = await getBusinessIdeas(
          checkedFocus,
          checkedTrends,
          checkedCv
        );
        await updateFirebaseWithTokens(results, credits, setCredits, user);

        let response = results.choices[0].message.content;
        parsedResponse = JSON.parse(response);

        // Add empty context info and starting info to each idea
        parsedResponse = parsedResponse.map((idea) => {
          return {
            ...idea,
            "Creating the product": "",
            "Finding customers": "",
            "Selling product": "",
          };
        });
        console.log("parsedResponse", parsedResponse);
        success = true; // set the flag to true if the function call is successful
      } catch (error) {
        console.log(
          "TODO: See if the delay fixes the cold start problem - from BodyComponent. I changed the min instances to 1 and max instance to 3000 for the cloud functions, let's see if that fixes the cold start problem. I also need to see how that affects the billing."
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
            <InfoDialog
              title="How to use this site"
              data={howToGuide}
              buttonType="solid-button"
            ></InfoDialog>
            <a
              className="transparent-button RemoveUnderline"
              href="https://mailchi.mp/d065db958da3/sps-digital-tech"
            >
              Join Newsletter
            </a>
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
                  <ConfirmationDelete
                    onDeleteConfirm={() => {
                      deleteIdeaFromFirebase(idea.id);
                      setPreviousIdeas(
                        previousIdeas.filter((i) => i.id !== idea.id)
                      );
                    }}
                  />
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
                      className={`button-link ${
                        selectedIdeaIndex === index ? "selected-idea" : ""
                      }`}
                      onClick={() => {
                        setSelectedIdeaIndex(index);
                        loadIdea({ data: exampleIdea });
                      }}
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
                onClick={businessIdeasClick}
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
