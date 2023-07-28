import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { Cross2Icon } from '@radix-ui/react-icons';
import './Buttons.css';
import './ContextDialog.css';

export default function ContextDialog({ content, title }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="solid-card-button">Show Offering Optimization</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="ContextDialogOverlay" />
        <Dialog.Content className="ContextDialogContent">
          <Dialog.Title className="ContextDialogTitle">{title}</Dialog.Title>
          <Tabs.Root className="ContextTabsRoot" defaultValue="Consumer Pain Point">
            <Tabs.List className="ContextTabsList" aria-label="How To Tabs">
              <Tabs.Trigger className="ContextTabsTrigger" value="Consumer Pain Point">
                Consumer Pain Point
              </Tabs.Trigger>
              <Tabs.Trigger className="ContextTabsTrigger" value="Effort">
                Effort
              </Tabs.Trigger>
              <Tabs.Trigger className="ContextTabsTrigger" value="Time">
                Time
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content className="ContextTabsContent" value="Consumer Pain Point">
              {content && <p key={Math.random()}>{content['Consumer Pain Point']}</p>}
            </Tabs.Content>
            <Tabs.Content className="ContextTabsContent" value="Effort">
              {content && <p key={Math.random()}>{content['Effort']}</p>}
            </Tabs.Content>
            <Tabs.Content className="ContextTabsContent" value="Time">
              {content && <p key={Math.random()}>{content['Time']}</p>}
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
