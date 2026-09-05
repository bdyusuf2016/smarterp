import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ConfirmationModal, ConfirmModalOptions } from '../components/common/ConfirmationModal';

export type ConfirmOptions = ConfirmModalOptions;

interface ConfirmationContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

// Global fallback ref so confirm can even be called from outside React components if ever needed
let globalConfirmHandler: ((options: ConfirmOptions | string) => Promise<boolean>) | null = null;

export const confirmAction = async (options: ConfirmOptions | string): Promise<boolean> => {
  if (globalConfirmHandler) {
    return globalConfirmHandler(options);
  }
  // Fallback to native window.confirm if context not mounted
  const message = typeof options === 'string' ? options : (options.message || options.title);
  return window.confirm(message);
};

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
  }>({
    isOpen: false,
    options: { title: '' }
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((optionsOrMessage: ConfirmOptions | string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      // Cancel previous pending confirmation if any
      if (resolverRef.current) {
        resolverRef.current(false);
      }
      resolverRef.current = resolve;

      const options: ConfirmOptions =
        typeof optionsOrMessage === 'string'
          ? {
              title: 'নিশ্চিতকরণ',
              message: optionsOrMessage,
              type: 'info'
            }
          : optionsOrMessage;

      setModalState({
        isOpen: true,
        options
      });
    });
  }, []);

  // Register global handler
  globalConfirmHandler = confirm;

  const handleConfirm = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        {...modalState.options}
      />
    </ConfirmationContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    // If used outside provider, fallback gracefully
    return {
      confirm: confirmAction
    };
  }
  return context;
};
