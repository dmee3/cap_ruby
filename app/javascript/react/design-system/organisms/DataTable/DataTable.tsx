import React, { useState, useMemo } from 'react';
import classNames from 'classnames';
import styles from './DataTable.module.scss';
import Icon from '../../atoms/Icon';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/solid';

export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  className?: string;
}

export const DataTable = <T,>({
  columns,
  data,
  onRowClick,
  className,
}: DataTableProps<T>) => {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable || typeof column.accessor !== 'string') {
      return;
    }

    const newDirection =
      sortColumn === column.accessor && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column.accessor as keyof T);
    setSortDirection(newDirection);
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  return (
    <table className={classNames(styles.table, className)}>
      <thead className={styles.header}>
        <tr>
          {columns.map((column) => (
            <th
              key={column.header}
              className={styles.headerCell}
              onClick={() => handleSort(column)}
            >
              {column.header}
              {column.sortable && sortColumn === column.accessor && (
                <Icon size="sm">
                  {sortDirection === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                </Icon>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className={styles.row}
            onClick={() => onRowClick?.(row)}
          >
            {columns.map((column, colIndex) => (
              <td key={colIndex} className={styles.cell}>
                {typeof column.accessor === 'function'
                  ? column.accessor(row)
                  : (row[column.accessor] as React.ReactNode)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
