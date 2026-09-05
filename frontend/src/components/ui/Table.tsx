import React from 'react';
import {
  Table as HeroUITable,
  TableHeader as HeroUITableHeader,
  TableColumn as HeroUITableColumn,
  TableBody as HeroUITableBody,
  TableRow as HeroUITableRow,
  TableCell as HeroUITableCell,
} from '@heroui/react';
import { cn } from '../../lib/utils';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className, children, ...props }) => (
  <div className="relative w-full overflow-auto rounded-2xl border border-border/50 dark:border-white/[0.08] bg-card/85 backdrop-blur-xl shadow-hero-card">
    <table className={cn('w-full caption-bottom text-sm text-left', className)} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => (
  <thead className={cn('bg-muted/40 border-b border-border/50 text-xs font-bold text-muted-foreground uppercase tracking-wider', className)} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => (
  <tbody className={cn('divide-y divide-border/30', className)} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, children, ...props }) => (
  <tr className={cn('hover:bg-muted/30 transition-colors duration-150', className)} {...props}>
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => (
  <th className={cn('h-12 px-6 text-left align-middle font-bold text-muted-foreground text-xs tracking-wider', className)} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => (
  <td className={cn('px-6 py-4.5 align-middle text-foreground/90 text-xs sm:text-sm font-sans', className)} {...props}>
    {children}
  </td>
);

// Re-export HeroUI primitives for direct declarative usage
export {
  HeroUITable,
  HeroUITableHeader,
  HeroUITableColumn,
  HeroUITableBody,
  HeroUITableRow,
  HeroUITableCell,
};
