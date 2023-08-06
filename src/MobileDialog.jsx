import React from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import PricingDialog from "./PricingDialog";
import ProfileDialog from "./ProfileDialog";
import { FiMenu } from "react-icons/fi";
import "./MobileDialog.css";
import { PricingContext } from "./App";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export default function MobileDialog() {
  const { showPricingDialog, setShowPricingDialog } =
    React.useContext(PricingContext);

  const Buttons = () => (
    <>
      <PricingDialog
        open={showPricingDialog}
        onClose={() => setShowPricingDialog(false)}
        purchaseTypeFilter="recurring"
        title="Subscriptions"
        trigger={true}
      ></PricingDialog>
      <PricingDialog
        open={showPricingDialog}
        onClose={() => setShowPricingDialog(false)}
        purchaseTypeFilter="one_time"
        title="Buy Credits"
      ></PricingDialog>
      <ProfileDialog></ProfileDialog>
    </>
  );

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <FiMenu className="HamburgerIcon mobile-trigger" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="MobileDialogContent">
        <Buttons />
        <DropdownMenu.Arrow />
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
