import './App.css';
import Header from './Header';
import BodyComponent from './BodyComponent';
import React from 'react';

export const UserContext = React.createContext(null);
export const CreditContext = React.createContext();

function App() {
    const [user, setUser] = React.useState(null);
    const [credits, setCredits] = React.useState(0);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            <CreditContext.Provider value={{ credits, setCredits }}>
                <div className="App">
                    <Header></Header>
                    <BodyComponent></BodyComponent>
                </div>
            </CreditContext.Provider>
        </UserContext.Provider>
    );
}

export default App;
