import "./BodyComponent.css";
import "./index.css";
import CustomTextarea from "./CustomTextarea";
import React from "react";
import {
  getBusinessIdeasOpenAITest,
  updateFirebaseWithTokens,
} from "./HelperFunctions";
import LandingImage from "./assets/images/lighbulb_shadow.png";
import ResultsTable from "./ResultsTable";
import Spinner from "./Spinner";
import "./Buttons.css";
import { UserContext } from "./App";
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

  async function businessIdeasOpenAITest() {
    if (!user) {
      setShowLoginDialog(true);
    } else {
      setIdeasLoading(true);
      setIdeaResults([]);
      let checkedFocus = focus ? focus : "Random product or service";
      let checkedTrends = trends ? trends : "Any customer";
      let checkedCv = cv ? cv : "Various skills";
      const results = await getBusinessIdeasOpenAITest(
        checkedFocus,
        checkedTrends,
        checkedCv
      );
      await updateFirebaseWithTokens(results, credits, setCredits, user);

      let response = results.data.choices[0].message.content;
      let parsedResponse = JSON.parse(response);
      parsedResponse = parsedResponse.map((item) => ({
        ...item,
        "Consumer Pain Point": [],
        Effort: [],
        Time: [],
        "Creating the product": [],
        "Finding customers": [],
        "Selling product": [],
      }));

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
                    className="delete-button"
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
