import "./App.css";
import Header from "./Header";
import Footer from "./Footer";
import BodyComponent from "./BodyComponent";
import React from "react";

export const UserContext = React.createContext(null);
export const CreditContext = React.createContext();
export const PricingContext = React.createContext();

function App() {
  const [user, setUser] = React.useState(null);
  const [credits, setCredits] = React.useState(0);
  const [showPricingDialog, setShowPricingDialog] = React.useState(false);

  return (
    <PricingContext.Provider
      value={{ showPricingDialog, setShowPricingDialog }}
    >
      <UserContext.Provider value={{ user, setUser }}>
        <CreditContext.Provider value={{ credits, setCredits }}>
          <div className="App">
            <Header></Header>
            <BodyComponent></BodyComponent>
            <Footer></Footer>
          </div>
        </CreditContext.Provider>
      </UserContext.Provider>
    </PricingContext.Provider>
  );
}

export default App;
