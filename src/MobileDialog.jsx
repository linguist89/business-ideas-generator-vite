import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import PricingDialog from "./PricingDialog";
import ProfileDialog from "./ProfileDialog";
import { FiMenu } from "react-icons/fi";
import "./MobileDialog.css";

export default function MobileDialog() {
  const Buttons = () => (
    <>
      <PricingDialog
        purchaseTypeFilter="recurring"
        title="Subscriptions"
      ></PricingDialog>
      <PricingDialog
        purchaseTypeFilter="one_time"
        title="Buy Credits"
      ></PricingDialog>
      <ProfileDialog></ProfileDialog>
    </>
  );

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <FiMenu className="HamburgerIcon" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="MobileDialogOverlay" />
        <Dialog.Content className="MobileDialogContent">
          <Buttons />
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
