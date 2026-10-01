'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { promoteToTA, demoteToStudent } from '@/app/actions';
import { toast } from 'sonner';

export type Participant = {
  id: string;
  name: string;
  roll_number: string;
  role: 'TA' | 'Student';
};

interface ParticipantsTableProps {
  data: Participant[];
  isTA?: boolean;
  courseCode?: string;
  currentUserId?: string;
}

function createColumns(
  isTA: boolean,
  courseCode: string,
  currentUserId: string,
  onAction: () => void
): ColumnDef<Participant>[] {
  const baseColumns: ColumnDef<Participant>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'roll_number',
      header: 'Roll Number',
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue('roll_number')}</div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue('role')}</div>
      ),
    },
  ];

  if (isTA && courseCode) {
    baseColumns.push({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const participant = row.original;
        const isSelf = participant.id === currentUserId;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isSelf}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {participant.role === 'Student' ? (
                <DropdownMenuItem
                  onClick={async () => {
                    const result = await promoteToTA(
                      courseCode,
                      participant.id
                    );
                    if (result.error) {
                      toast.error(result.error);
                    } else {
                      toast.success(`${participant.name} is now a TA`);
                      onAction();
                    }
                  }}
                >
                  Promote to TA
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={async () => {
                    const result = await demoteToStudent(
                      courseCode,
                      participant.id
                    );
                    if (result.error) {
                      toast.error(result.error);
                    } else {
                      toast.success(`${participant.name} is now a Student`);
                      onAction();
                    }
                  }}
                >
                  Demote to Student
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return baseColumns;
}

export function ParticipantsTable({
  data,
  isTA = false,
  courseCode = '',
  currentUserId = '',
}: ParticipantsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const columns = React.useMemo(
    () => createColumns(isTA, courseCode, currentUserId, forceUpdate),
    [isTA, courseCode, currentUserId]
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter names..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={event =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button
          variant="outline"
          onClick={() => table.getColumn('role')?.setFilterValue(undefined)}
        >
          All
        </Button>
        <Button
          variant={
            table.getColumn('role')?.getFilterValue() === 'Student'
              ? 'default'
              : 'outline'
          }
          onClick={() => table.getColumn('role')?.setFilterValue('Student')}
        >
          Students
        </Button>
        <Button
          variant={
            table.getColumn('role')?.getFilterValue() === 'TA'
              ? 'default'
              : 'outline'
          }
          onClick={() => table.getColumn('role')?.setFilterValue('TA')}
        >
          TAs
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
