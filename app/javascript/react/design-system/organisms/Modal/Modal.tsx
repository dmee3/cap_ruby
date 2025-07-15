import React, { FC, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.scss';
import { Icon, Text, Button } from '@/react/design-system/atoms';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const modalRoot = document.createElement('div');
modalRoot.setAttribute('id', 'modal-root');
document.body.appendChild(modalRoot);


export const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <Text as="h2" size="lg" weight="bold">{title}</Text>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            <Icon>X</Icon>
          </Button>
        </header>
        <div className={styles.content}>
          {children}
        </div>
        {footer && (
          <footer className={styles.footer}>
            {footer}
          </footer>
        )}
      </div>
    </div>,
    modalRoot
  );
};
