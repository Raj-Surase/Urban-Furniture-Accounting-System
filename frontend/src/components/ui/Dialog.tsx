import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@heroui/react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backdrop="blur"
      radius="lg"
      scrollBehavior="inside"
      classNames={{
        base: 'border border-border/50 dark:border-white/[0.08] bg-card/95 backdrop-blur-2xl shadow-hero-modal rounded-2xl overflow-hidden max-h-[90vh]',
        backdrop: 'bg-background/60 backdrop-blur-md',
      }}
      className={className}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1.5 pb-2 pt-6 sm:pt-8 px-6 sm:px-8 shrink-0">
          <h2 className="text-xl font-black text-foreground tracking-tight font-sans">{title}</h2>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground font-normal leading-relaxed font-sans">{description}</p>
          )}
        </ModalHeader>
        <ModalBody className="p-6 sm:p-8 pt-2 pb-6 sm:pb-8 overflow-y-auto overscroll-contain">{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
