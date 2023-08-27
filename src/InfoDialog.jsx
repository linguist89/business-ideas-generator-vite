import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "./InfoDialog.css";
import "./Buttons.css";

function RenderContent({ data }) {
  return (
    <div>
      {Object.entries(data).map(([key, value], index) => {
        // Exclude Title and Subtitle from mapping
        if (key === "Title" || key === "Subtitle") return null;

        if (Array.isArray(value)) {
          return (
            <ol key={index}>
              {value.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ol>
          );
        } else if (typeof value === "object") {
          return (
            <div key={index}>
              <h4>{key}</h4>
              <RenderContent data={value} />
            </div>
          );
        } else if (typeof value === "string") {
          return (
            <p key={index}>
              <strong>{key}:</strong> {value}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}

function InfoDialog({ open, onClose, data, buttonType }) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Trigger asChild>
        <button className={buttonType}>{data && data.Title}</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="InfoDialogOverlay" />
        <Dialog.Content className="InfoDialogContent">
          <h1>{data && data.Title}</h1>
          <h3>{data && data.Subtitle}</h3>
          <RenderContent data={data} />
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
