import React from 'react';
import classNames from 'classnames';
import styles from './PageLayout.module.scss';

export interface PageLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  sidebar,
  children,
  className,
}) => {
  return (
    <div className={classNames(styles.layout, className)}>
      <aside className={styles.sidebar}>{sidebar}</aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
};
