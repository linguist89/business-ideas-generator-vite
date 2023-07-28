import React, { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import './Buttons.css';
import './BuyCreditsDialog.css';
import { UserContext, CreditContext } from './App';
import { db } from './Firebase.jsx';
import { doc, increment, setDoc } from 'firebase/firestore';

export default function BuyCreditsDialog() {
    const [newCredits, setNewCredits] = useState(100);
    const [isOpen, setIsOpen] = useState(false); // state to manage dialog open/close
    const { user } = React.useContext(UserContext);
    const { setCredits } = React.useContext(CreditContext);

    const newCreditsIncrement = () => setNewCredits(newCredits + 100);
    const newCreditsDecrement = () => setNewCredits(newCredits > 0 ? newCredits - 100 : 0);

    const closeDialog = useCallback(() => setIsOpen(false), []); // function to close the dialog

    async function addCredits() {
        try {
            const userCreditsRef = doc(db, 'customers', user.uid, 'credits', 'total');
            await setDoc(userCreditsRef, { amount: increment(newCredits) }, { merge: true });
            setCredits(previousCredits => (previousCredits + newCredits));
            console.log("Credits successfully updated!");
            closeDialog(); // close dialog once credits added
        } catch (error) {
            console.error("Error updating credits: ", error);
            alert(`There has been an error with your purchase`);
        }
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger asChild>
                <button className="transparent-button">Buy Credits</button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="BuyCreditsDialogOverlay" />
                <Dialog.Content className="BuyCreditsDialogContent">
                    <Dialog.Title className="BuyCreditsDialogTitle">Buy credits</Dialog.Title>
                    <div className="CreditsControl">
                        <button className="credit-button" onClick={newCreditsDecrement}>-</button>
                        <p>{newCredits}</p>
                        <button className="credit-button" onClick={newCreditsIncrement}>+</button>
                    </div>
                    <div style={{ display: 'flex', marginTop: 25, justifyContent: 'flex-end' }}>
                        <button className="solid-card-button" onClick={closeDialog}>Cancel</button>
                        <button className="solid-card-button" onClick={addCredits}>Buy</button>
                    </div>
                    <button className="IconButton" aria-label="Close" onClick={closeDialog}>
                        <Cross2Icon />
                    </button>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
