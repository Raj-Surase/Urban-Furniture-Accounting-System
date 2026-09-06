import React, { useEffect, useRef } from 'react';
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
 * Global reference counter and style manager for document body scroll locking.
 * Avoids race conditions where nested or transitioning modals overwrite and trap
 * `overflow: hidden` on the page body.
 */
let lockCount = 0;
let originalBodyOverflow: string | null = null;
let originalHtmlOverflow: string | null = null;
let originalPaddingRight: string | null = null;

export const lockBodyScroll = () => {
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar width to prevent page jitter / layout shifting
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
  lockCount++;
};

export const unlockBodyScroll = () => {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalBodyOverflow || '';
    document.documentElement.style.overflow = originalHtmlOverflow || '';
    document.body.style.paddingRight = originalPaddingRight || '';
    originalBodyOverflow = null;
    originalHtmlOverflow = null;
    originalPaddingRight = null;

    // Clean up any residual react-aria attributes if present
    document.body.removeAttribute('data-react-aria-prevent-scroll');
    document.documentElement.removeAttribute('data-react-aria-prevent-scroll');
  }
};

export const forceResetBodyScroll = () => {
  if (typeof document === 'undefined') return;

  lockCount = 0;
  originalBodyOverflow = null;
  originalHtmlOverflow = null;
  originalPaddingRight = null;

  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  document.body.style.paddingRight = '';

  document.body.removeAttribute('data-react-aria-prevent-scroll');
  document.documentElement.removeAttribute('data-react-aria-prevent-scroll');
};

/**
 * PortalModal mounts modals directly to document.body via React Portal.
 * This guarantees:
 * 1. The backdrop covers the entire viewport (100vw x 100vh) and is never clipped
 *    by parent transforms (e.g., framer-motion PageTransition).
 * 2. Predictable stacking contexts using explicit Tailwind z-index classes
 *    (z-[60] for primary modals, z-[70] for secondary/nested action modals, z-[75] for PDF preview, z-[80] for alerts).
 * 3. Expandable `min-h-full` centering: prevents tall dialogs from receiving negative top margins
 *    and getting clipped or scroll-stuck at the top.
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
  const isLockedRef = useRef(false);

  // Lock/unlock body scroll safely based strictly on isOpen
  useEffect(() => {
    if (isOpen) {
      if (!isLockedRef.current) {
        lockBodyScroll();
        isLockedRef.current = true;
      }
    } else {
      if (isLockedRef.current) {
        unlockBodyScroll();
        isLockedRef.current = false;
      }
    }

    return () => {
      if (isLockedRef.current) {
        unlockBodyScroll();
        isLockedRef.current = false;
      }
    };
  }, [isOpen]);

  // Handle ESC key press without re-triggering body scroll locking
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 ${zIndex} overflow-y-auto overscroll-contain bg-black/80 backdrop-blur-md transition-all animate-in fade-in duration-200 ${backdropClassName}`}
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* 
        Scroll Centering Wrapper:
        - min-h-full ensures the container is at least viewport height so small dialogs center cleanly.
        - When children exceed viewport height, min-h-full expands, ensuring the outer scrollbar
          scrolls starting at y=0 without any negative margin clipping at the top.
      */}
      <div
        className="min-h-full w-full flex items-center justify-center p-3 sm:p-4 md:p-6"
        onClick={(e) => {
          if (closeOnBackdropClick && e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative my-auto w-full overscroll-contain ${maxWidth} ${containerClassName}`}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PortalModal;
