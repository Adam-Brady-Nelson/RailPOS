import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type ConfirmOptions = {
  message: string;
  detail?: string;
  buttons?: string[]; // order matters; return value is index
};

type ConfirmContextValue = (opts: ConfirmOptions) => Promise<number>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

type ActiveDialog = ConfirmOptions & { resolve: (idx: number) => void };

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);
  const [prevHash, setPrevHash] = useState<string | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<number>((resolve) => {
      setDialog({
        message: opts.message,
        detail: opts.detail,
        buttons: opts.buttons ?? ['Cancel', 'OK'],
        resolve,
      });
    });
  }, []);

  const onClose = useCallback((idx: number) => {
    if (!dialog) return;
    const r = dialog.resolve;
    setDialog(null);
    r(idx);
  }, [dialog]);

  const value = useMemo(() => confirm, [confirm]);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (dialog) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Lock hash navigation (HashRouter) while dialog is open
      const currentHash = window.location.hash;
      setPrevHash(currentHash);
      const onHashChange = () => {
        if (dialog && prevHash !== null && window.location.hash !== prevHash) {
          // Revert navigation
          window.location.hash = prevHash;
        }
      };
      window.addEventListener('hashchange', onHashChange);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('hashchange', onHashChange);
        setPrevHash(null);
      };
    }
  }, [dialog]);

  const modal = dialog ? (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => onClose(0)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483646, // very high to ensure on top
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
      />
      {/* Modal */}
      <div
        onClick={(e) => { e.stopPropagation(); }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.stopPropagation(); onClose(0); }
          if (e.key === 'Enter') { e.stopPropagation(); onClose((dialog.buttons?.length ?? 2) - 1); }
        }}
        tabIndex={-1}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '90%',
          maxWidth: 480,
          borderRadius: 12,
          background: '#ffffff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          border: '1px solid #e5e7eb',
          padding: 20,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{dialog.message}</h2>
        {dialog.detail && <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 16 }}>{dialog.detail}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {(dialog.buttons ?? ['Cancel', 'OK']).map((label, idx) => (
            <button
              key={idx}
              onClick={() => onClose(idx)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                fontWeight: 600,
                border: '1px solid ' + (idx === (dialog.buttons?.length ?? 2) - 1 ? '#2563eb' : '#374151'),
                background: idx === (dialog.buttons?.length ?? 2) - 1 ? '#2563eb' : '#374151',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {modal ? createPortal(modal, document.body) : null}
    </ConfirmContext.Provider>
  );
};

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
