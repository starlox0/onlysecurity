import React from 'react';
import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import NotificationBell from '@site/src/components/NotificationBell';

export default {
  ...ComponentTypes,
  'custom-notificationBell': () => <NotificationBell />,
};
