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
  if(sport === 'Running') return <Activity size={size} className="text-accent"/>;
  if(sport === 'Cycling') return <Bike size={size} className="text-success"/>;
  if(sport === 'Swimming') return <Droplet size={size} className="text-purple-500"/>;
  if(sport === 'Strength Training') return <Dumbbell size={size} className="text-warning"/>;
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
          <span>{info.getValue()}</span>
        </div>
      )
    },
    {
      accessorKey: 'type',
      header: 'Type'
    },
    {
      accessorFn: row => `${row.distance ? row.distance + (row.sport==='Swimming'?'m':'km') : ''} ${row.duration}`,
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
      cell: info => <span className="font-bold">{info.getValue()}</span>
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button className="text-gray-400 hover:text-accent transition-colors">
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => {
               if(window.confirm('Delete this workout?')) {
                  dispatch(deleteWorkout(row.original.id));
               }
            }}
            className="text-gray-400 hover:text-danger transition-colors"
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
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Training History</h1>
        <p className="text-gray-400 mt-1">View, edit, and analyze your past workouts.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-[#334155]">
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      className="p-3 text-sm font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                         {flexRender(header.column.columnDef.header, header.getContext())}
                         {header.column.getCanSort() && <ArrowUpDown size={12} className="opacity-50"/>}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/20 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-3 text-sm text-gray-200">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                   <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                      No workouts found. Log your first session!
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */ }
        <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
           <span>Showing page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}</span>
           <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => table.previousPage()} 
                disabled={!table.getCanPreviousPage()}
              >
                 <ChevronLeft size={16}/> Prev
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => table.nextPage()} 
                disabled={!table.getCanNextPage()}
              >
                 Next <ChevronRight size={16}/>
              </Button>
           </div>
        </div>
      </Card>
    </div>
  );
};

export default TrainingHistory;
