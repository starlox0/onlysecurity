import React from 'react';
import CommandPalette from '@site/src/components/CommandPalette';
import NotificationBell from '@site/src/components/NotificationBell';

// Docusaurus renders whatever is at src/theme/Root.js around the entire
// app, on every page — the supported way to add something global (like a
// command palette or notification bell) without ejecting or touching the
// real page layout.
export default function Root({children}) {
  return (
    <>
      {children}
      <CommandPalette />
      <NotificationBell />
    </>
  );
}
