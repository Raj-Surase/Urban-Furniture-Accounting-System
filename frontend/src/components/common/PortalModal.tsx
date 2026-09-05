import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  zIndex?: string;
  maxWidth?: string;
  backdropClassName?: string;
  containerClassName?: string;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
}

/**
 * PortalModal mounts modals directly to document.body via React Portal.
 * This guarantees:
 * 1. The backdrop covers the entire viewport (100vw x 100vh) and is never clipped
 *    by parent transforms (e.g., framer-motion PageTransition).
 * 2. Predictable stacking contexts using explicit Tailwind z-index classes
 *    (z-[60] for primary modals, z-[70] for secondary/nested action modals, z-[75] for PDF preview, z-[80] for alerts).
 */
export const PortalModal: React.FC<PortalModalProps> = ({
  isOpen,
  onClose,
  children,
  zIndex = 'z-[60]',
  maxWidth = '',
  backdropClassName = '',
  containerClassName = '',
  closeOnBackdropClick = true,
  closeOnEsc = true,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (closeOnBackdropClick) onClose();
      }}
      className={`fixed inset-0 ${zIndex} overflow-y-auto bg-black/80 backdrop-blur-md flex justify-center p-3 sm:p-4 md:p-6 transition-all animate-in fade-in duration-200 ${backdropClassName}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative my-auto w-full ${maxWidth} ${containerClassName}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default PortalModal;
