import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import './Buttons.css';
import './StripePricingDialog.css';
import StripePricingTable from './StripePricingTable';

export default function StripePricingDialog() {
    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <button className="transparent-button">Subcriptions</button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="StripePricingDialogOverlay" />
                <Dialog.Content className="StripePricingDialogContent">
                    <Dialog.Title className="StripePricingDialogTitle">Pricing Plans</Dialog.Title>
                    <StripePricingTable></StripePricingTable>
                    <div style={{ display: 'flex', marginTop: 25, justifyContent: 'flex-end' }}>
                        <Dialog.Close asChild>
                            <button className="solid-card-button">Close</button>
                        </Dialog.Close>
                    </div>
                    <Dialog.Close asChild>
                        <button className="IconButton" aria-label="Close">
                            <Cross2Icon />
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
