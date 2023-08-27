import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "./NewsletterDialog.css";

export default function NewsletterDialog() {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    // Handle the form submission, e.g., send the email to the backend
    console.log("Email submitted:", email);
  };

  return (
    <div>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button className="transparent-button">Join Newsletter</button>
        </Dialog.Trigger>
        <Dialog.Content className="NewsletterDialogContent">
          <h3>Join the newsletter</h3>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={handleSubmit}>Join</button>
          <Dialog.Close asChild>
            <button className="IconButton" aria-label="Close">
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}
