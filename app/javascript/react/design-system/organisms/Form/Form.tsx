import React from 'react';
import styles from './Form.module.scss';

export interface FormProps {
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
}

export const Form: React.FC<FormProps> = ({ children, onSubmit, className }) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(event);
  };

  return (
    <form className={`${styles.form} ${className || ''}`} onSubmit={handleSubmit}>
      {children}
    </form>
  );
};
