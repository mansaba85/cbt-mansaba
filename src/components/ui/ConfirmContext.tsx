import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmDialog from './ConfirmDialog';

interface ConfirmOptions {
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogConfig, setDialogConfig] = useState<ConfirmOptions & { isOpen: boolean } | null>(null);
  const [resolveCallback, setResolveCallback] = useState<(value: boolean) => void>(() => {});

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialogConfig({ ...options, isOpen: true });
      setResolveCallback(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setDialogConfig(prev => prev ? { ...prev, isOpen: false } : null);
    resolveCallback(true);
  };

  const handleCancel = () => {
    setDialogConfig(prev => prev ? { ...prev, isOpen: false } : null);
    resolveCallback(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialogConfig && (
        <ConfirmDialog
          isOpen={dialogConfig.isOpen}
          title={dialogConfig.title}
          message={dialogConfig.message}
          type={dialogConfig.type}
          confirmLabel={dialogConfig.confirmLabel}
          cancelLabel={dialogConfig.cancelLabel}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};
