import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "./ProfileDialog.css";
import { signOut } from "firebase/auth";
import { UserContext, CreditContext } from "./App";
import { auth } from "./Firebase.jsx";
import useUserSubscription from "./useUserSubscription";

function ProfileDialog({ open, onClose }) {
  const { user, setUser } = React.useContext(UserContext);
  const { credits, setCredits } = React.useContext(CreditContext);
  const { userPlan, userPlanActivity, renewalDate } = useUserSubscription(
    setUser,
    setCredits
  );

  function handleDeleteProfile() {
    alert("Deleted account");
  }

  React.useEffect(() => {
    if (!user) {
      onClose(false);
    }
  }, [user, onClose]);

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Trigger asChild>
        <button className="transparent-button">Profile</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="ProfileDialogOverlay" />
        <Dialog.Content className="ProfileDialogContent">
          <div>
            <h1 className="profile-heading">Profile</h1>
            {user && (
              <div>
                {user.emailVerified ? (
                  <>
                    <p>
                      <b>User: </b>
                      {user.displayName ? user.displayName : user.email}
                      <p>
                        <b>Credits Remaining: </b>
                        {credits}
                      </p>
                    </p>
                    <p>
                      <b>Current Plan: </b>
                      {userPlan}
                    </p>
                    <p>
                      <b>Renewal Date: </b>
                      {renewalDate}
                    </p>
                  </>
                ) : (
                  <>
                    <p>Please verify your email</p>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="profile-information">
            <button
              className="solid-card-button DeleteBackgroundRed"
              onClick={handleDeleteProfile}
            >
              Delete Account
            </button>
            <button className="solid-card-button" onClick={() => signOut(auth)}>
              Logout
            </button>
          </div>
          <Dialog.Close asChild>
            <button className="IconButton" aria-label="Close">
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default ProfileDialog;
