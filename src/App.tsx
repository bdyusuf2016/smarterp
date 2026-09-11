/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { ConfirmationProvider } from './context/ConfirmationContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ConfirmationProvider>
        <AppLayout />
      </ConfirmationProvider>
    </ErrorBoundary>
  );
}

