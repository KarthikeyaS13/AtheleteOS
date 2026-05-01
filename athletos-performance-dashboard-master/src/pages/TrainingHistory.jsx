import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { deleteWorkout } from '../store/slices/workoutsSlice';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender
} from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { Activity, Bike, Dumbbell, Droplet, Trash2, Edit2, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const SportIcon = ({ sport, size = 16 }) => {
  if (sport === 'Running') return <Activity size={size} className="text-accent" />;
  if (sport === 'Cycling') return <Bike size={size} className="text-success" />;
  if (sport === 'Swimming') return <Droplet size={size} className="text-purple-500" />;
  if (sport === 'Strength Training') return <Dumbbell size={size} className="text-warning" />;
  return null;
}

const TrainingHistory = () => {
  const workouts = useSelector(state => state.workouts.data);
  const dispatch = useDispatch();

  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageSize: 10, pageIndex: 0 });

  const columns = useMemo(() => [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: info => format(parseISO(info.getValue()), 'MMM d, yyyy')
    },
    {
      accessorKey: 'sport',
      header: 'Sport',
      cell: info => (
        <div className="flex items-center gap-2">
          <SportIcon sport={info.getValue()} />
          <span className="text-black dark:text-white">{info.getValue()}</span>
        </div>
      )
    },
    {
      accessorKey: 'type',
      header: 'Type'
    },
    {
      accessorFn: row => `${row.distance ? row.distance + (row.sport === 'Swimming' ? 'm' : 'km') : ''} ${row.duration}`,
      id: 'volume',
      header: 'Volume',
    },
    {
      accessorKey: 'rpe',
      header: 'RPE',
      cell: info => <span className="font-bold text-accent">{info.getValue()}/10</span>
    },
    {
      accessorKey: 'loadScore',
      header: 'Load',
      cell: info => <span className="font-bold text-black dark:text-white">{info.getValue()}</span>
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button className="text-gray-500 dark:text-gray-400 hover:text-accent transition-colors">
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => {
              if (window.confirm('Delete this workout?')) {
                dispatch(deleteWorkout(row.original.id));
              }
            }}
            className="text-gray-500 dark:text-gray-400 hover:text-danger transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ], [dispatch]);

  const table = useReactTable({
    data: workouts,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">
          Training History
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View, edit, and analyze your past workouts.
        </p>
      </div>

      <Card className='dark:bg-gray-800'>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse ">

            {/* TABLE HEADER */}
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr
                  key={headerGroup.id}
                  className="bg-gray-100 rounded-xl dark:bg-[#182233] 
             border-b border-gray-200 dark:border-[#2d3a4f]"
                >
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="p-3 text-sm font-medium text-gray-800 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-black dark:hover:text-white transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ArrowUpDown size={12} className="opacity-50" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* TABLE BODY */}
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className="bg-white dark:bg-[#111827] 
                    border-b border-gray-100 dark:border-[#1e293b] 
                    hover:bg-gray-100 dark:hover:bg-[#1e293b] 
                    transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="p-3 text-sm text-gray-900 dark:text-gray-100"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}

              {/* EMPTY STATE */}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-8 text-gray-600 dark:text-gray-400"
                  >
                    No workouts found. Log your first session!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-200">
          <span className='text-gray-700 dark:text-white'>
            Showing page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-gray-500 dark:bg-[#1e293b] 
             text-gray-900 dark:text-gray-200 
             border border-gray-300 dark:border-[#eaedf3] 
             hover:bg-gray-600 dark:hover:bg-[#243244]"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft size={16} /> Prev
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="bg-gray-500 dark:bg-[#1e293b] 
             text-gray-900 dark:text-gray-200 
             border border-gray-300 dark:border-[#eaedf3] 
             hover:bg-gray-600 dark:hover:bg-[#243244]"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>

      </Card>
    </div>
  );
};

export default TrainingHistory;