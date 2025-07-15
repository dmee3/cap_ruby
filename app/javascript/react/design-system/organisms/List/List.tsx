import React from 'react';
import classNames from 'classnames';
import styles from './List.module.scss';

export interface ListProps<T> {
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => React.Key;
  onItemClick?: (item: T) => void;
  className?: string;
  itemClassName?: (item: T) => string;
}

export const List = <T,>({
  data,
  renderItem,
  keyExtractor,
  onItemClick,
  className,
  itemClassName,
}: ListProps<T>) => {
  return (
    <ul className={classNames(styles.list, className)}>
      {data.map((item) => (
        <li
          key={keyExtractor(item)}
          className={classNames(
            styles.item,
            onItemClick && styles.clickable,
            itemClassName?.(item)
          )}
          onClick={() => onItemClick?.(item)}
        >
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
};
