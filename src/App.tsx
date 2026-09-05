/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { ConfirmationProvider } from './context/ConfirmationContext';

export default function App() {
  return (
    <ConfirmationProvider>
      <AppLayout />
    </ConfirmationProvider>
  );
}

