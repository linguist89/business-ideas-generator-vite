import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "./InfoDialog.css";
import "./Buttons.css";

function InfoDialog({ open, onClose, title, content, buttonType }) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Trigger asChild>
        <button className={buttonType}>{title}</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="InfoDialogOverlay" />
        <Dialog.Content className="InfoDialogContent">
          {content}
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

export default InfoDialog;
