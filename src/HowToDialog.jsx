import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { Cross2Icon } from '@radix-ui/react-icons';
import './Buttons.css';
import './HowToDialog.css';

export default function HowToDialog({ content }) {
    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <button className="solid-card-button">How to start</button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="HowToDialogOverlay" />
                <Dialog.Content className="HowToDialogContent">
                    <Dialog.Title className="HowToDialogTitle">How To Start</Dialog.Title>
                    <Tabs.Root className="HowToTabsRoot" defaultValue="Creating the product">
                        <Tabs.List className="HowToTabsList" aria-label="How To Tabs">
                            <Tabs.Trigger className="HowToTabsTrigger" value="Creating the product">
                                Creating the product
                            </Tabs.Trigger>
                            <Tabs.Trigger className="HowToTabsTrigger" value="Finding customers">
                                Finding customers
                            </Tabs.Trigger>
                            <Tabs.Trigger className="HowToTabsTrigger" value="Selling product">
                                Selling product
                            </Tabs.Trigger>
                        </Tabs.List>
                        <Tabs.Content className="HowToTabsContent" value="Creating the product">
                            {content && <p key={Math.random()}>{content['Creating the product']}</p>}
                        </Tabs.Content>
                        <Tabs.Content className="HowToTabsContent" value="Finding customers">
                            {content && <p key={Math.random()}>{content['Finding customers']}</p>}
                        </Tabs.Content>
                        <Tabs.Content className="HowToTabsContent" value="Selling product">
                            {content && <p key={Math.random()}>{content['Selling product']}</p>}
                        </Tabs.Content>
                    </Tabs.Root>
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
    );
}
