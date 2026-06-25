import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { deleteWorkout, updateWorkout } from '../store/slices/workoutsSlice';
import { calculateTrainingLoad } from '../utils/calculations';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender
} from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Activity, Bike, Dumbbell, Droplet, Trash2, Edit2, ChevronLeft, ChevronRight, ArrowUpDown, X, Save } from 'lucide-react';

const SportIcon = ({ sport, size = 16 }) => {
  if (sport === 'Running') return <Activity size={size} className="text-accent" />;
  if (sport === 'Cycling') return <Bike size={size} className="text-success" />;
  if (sport === 'Swimming') return <Droplet size={size} className="text-purple-500" />;
  if (sport === 'Strength Training') return <Dumbbell size={size} className="text-warning" />;
  return null;
}

const WorkoutSchema = Yup.object().shape({
  date: Yup.date().required('Required'),
  distance: Yup.number().min(0, 'Must be positive').when('sport', {
    is: (val) => val === 'Running' || val === 'Cycling' || val === 'Swimming',
    then: () => Yup.number().required('Required')
  }),
  duration: Yup.string().required('Required'),
  rpe: Yup.number().min(1).max(10).required('Required'),
});

const TrainingHistory = () => {
  const workouts = useSelector(state => state.workouts.data);
  const dispatch = useDispatch();

  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageSize: 10, pageIndex: 0 });
  const [editingWorkout, setEditingWorkout] = useState(null);

  const inputClass =
    "w-full bg-white dark:bg-[#111827] border-2 border-gray-300 dark:border-[#243244] rounded-xl px-4 py-1.5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/50 transition-all";

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
          <button 
            onClick={() => setEditingWorkout(row.original)}
            className="text-gray-500 dark:text-gray-400 hover:text-accent transition-colors p-1"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => {
              if (window.confirm('Delete this workout?')) {
                dispatch(deleteWorkout(row.original.id));
              }
            }}
            className="text-gray-500 dark:text-gray-400 hover:text-danger transition-colors p-1"
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
    <div className="space-y-4">

      {/* Header */}
      <div className="relative animate-in fade-in slide-up">
        <div className="absolute -left-4 top-0 w-1 h-full bg-accent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        <h1 className="text-3xl font-black text-gray-900 dark:text-white font-display tracking-tight italic uppercase">
          Training History
        </h1>
        <p className="text-gray-500 font-medium ml-1 mt-0.5 text-sm">
          View, edit, and analyze your past workouts.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse ">

            {/* TABLE HEADER */}
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr
                  key={headerGroup.id}
                  className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-b border-gray-200 dark:border-gray-800"
                >
                  {headerGroup.headers.map(header => (
                    <th
                       key={header.id}
                       className="py-3 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-accent transition-all group"
                       onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <div className="w-4 h-4 flex items-center justify-center rounded bg-gray-200/50 dark:bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          {header.column.getCanSort() && (
                            <ArrowUpDown size={10} className="text-accent" />
                          )}
                        </div>
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
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e293b]/30 transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                       key={cell.id}
                       className="py-2.5 px-4 text-sm text-gray-700 dark:text-gray-300"
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
                    className="text-center py-8 text-gray-500 italic text-sm"
                  >
                    No workouts found. Log your first session!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50/50 dark:bg-[#1e293b]/20 text-sm">
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            Page <span className="text-gray-900 dark:text-white">{table.getState().pagination.pageIndex + 1}</span> of {table.getPageCount() || 1}
          </span>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft size={16} className="mr-1" /> Prev
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>

      </Card>

      {/* EDIT MODAL */}
      {editingWorkout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <Card className="max-w-2xl w-full mx-4 p-5 shadow-xl transform animate-in zoom-in-95 duration-300 !overflow-visible">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit2 size={20} className="text-accent" />
                Edit Workout</h2>
              <button 
                onClick={() => setEditingWorkout(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <Formik
              initialValues={editingWorkout}
              validationSchema={WorkoutSchema}
              onSubmit={(values) => {
                const loadScore = calculateTrainingLoad(
                  values.sport,
                  Number(values.distance),
                  values.duration,
                  Number(values.rpe)
                );
                dispatch(updateWorkout({ ...values, loadScore }));
                setEditingWorkout(null);
              }}
            >
              {({ values, setFieldValue }) => (
                <Form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Date</label>
                      <DatePicker
                        selected={values.date ? parseISO(values.date) : null}
                        onChange={(date) => setFieldValue('date', date ? format(date, 'yyyy-MM-dd') : '')}
                        dateFormat="dd/MM/yyyy"
                        className={inputClass}
                        placeholderText="DD/MM/YYYY"
                        popperPlacement="bottom-start"
                        popperClassName="z-[9999]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sport</label>
                      <Field as="select" name="sport" className={inputClass}>
                        <option value="Running">Running</option>
                        <option value="Cycling">Cycling</option>
                        <option value="Swimming">Swimming</option>
                        <option value="Strength Training">Strength Training</option>
                      </Field>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Type</label>
                      <Field as="select" name="type" className={inputClass}>
                        <option value="Base">Base / Easy</option>
                        <option value="Tempo">Tempo</option>
                        <option value="Threshold">Threshold</option>
                        <option value="VO2Max">VO2 Max</option>
                        <option value="Long">Long</option>
                        <option value="Recovery">Recovery</option>
                        <option value="Race">Race</option>
                      </Field>
                    </div>

                    {values.sport !== 'Strength Training' && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Distance</label>
                        <Field name="distance" type="number" className={inputClass} />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Duration (HH:MM:SS)</label>
                      <Field name="duration" type="time" step="1" className={inputClass} />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">RPE (Perceived Effort)</label>
                        <span className="text-sm font-bold text-accent">{values.rpe}/10</span>
                      </div>
                      <Field type="range" name="rpe" min="1" max="10" className="w-full accent-accent" />
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#1e293b]/50 border border-gray-200 dark:border-gray-800 rounded-xl py-2 px-3 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">New Load Score</h4>
                      <p className="text-xs text-gray-400">Recalculated based on changes</p>
                    </div>
                    <div className="text-2xl font-black text-accent">
                      {calculateTrainingLoad(values.sport, values.distance, values.duration, values.rpe)}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => setEditingWorkout(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                    >
                      <Save size={18} className="mr-2" />
                      Update Workout
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TrainingHistory;
