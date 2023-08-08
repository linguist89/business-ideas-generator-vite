import React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import "./ConfirmationDelete.css";
import DeleteIcon from "./assets/images/DeleteIcon.svg";
import "./Buttons.css";

const AlertDialogDemo = ({ onDeleteConfirm }) => (
  <AlertDialog.Root>
    <AlertDialog.Trigger asChild>
      <button className="DeleteButton">
        <img src={DeleteIcon} alt="Delete Icon"></img>
      </button>
    </AlertDialog.Trigger>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="AlertDialogOverlay" />
      <AlertDialog.Content className="AlertDialogContent">
        <AlertDialog.Title className="AlertDialogTitle">
          Are you absolutely sure you want to delete this idea?
        </AlertDialog.Title>
        <AlertDialog.Description className="AlertDialogDescription">
          This action cannot be undone.
        </AlertDialog.Description>
        <div style={{ display: "flex", gap: 25, justifyContent: "flex-end" }}>
          <AlertDialog.Cancel asChild>
            <button className="solid-card-button">Cancel</button>
          </AlertDialog.Cancel>
          <AlertDialog.Action asChild>
            <button
              className="solid-card-button DeleteBackgroundRed"
              onClick={onDeleteConfirm}
            >
              Yes, delete
            </button>
          </AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>
);

export default AlertDialogDemo;
