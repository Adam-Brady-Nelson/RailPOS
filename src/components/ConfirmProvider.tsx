import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmProvider.css';

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
  }, [dialog, prevHash]);

  const modal = dialog ? (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => onClose(0)}
      className="confirm-modal"
    >
      {/* Backdrop */}
      <div className="confirm-modal__backdrop" />
      {/* Modal */}
      <div
        className="confirm-modal__dialog"
        onClick={(e) => { e.stopPropagation(); }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.stopPropagation(); onClose(0); }
          if (e.key === 'Enter') { e.stopPropagation(); onClose((dialog.buttons?.length ?? 2) - 1); }
        }}
        tabIndex={-1}
      >
        <h2 className="confirm-modal__title">{dialog.message}</h2>
        {dialog.detail && <p className="confirm-modal__detail">{dialog.detail}</p>}
        <div className="confirm-modal__actions">
          {(dialog.buttons ?? ['Cancel', 'OK']).map((label, idx) => (
            <button
              key={idx}
              onClick={() => onClose(idx)}
              className={`confirm-modal__btn${idx === (dialog.buttons?.length ?? 2) - 1 ? ' confirm-modal__btn--primary' : ''}`}
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
