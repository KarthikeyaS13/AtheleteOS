import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { differenceInDays, format, parseISO } from 'date-fns';
import { Calendar, Flag, Timer, PlusCircle, X, Save, Trash2, MapPin } from 'lucide-react';
import { addRace, deleteRace, updateRace } from '../store/slices/racesSlice';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const RaceSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  date: Yup.date().required('Required'),
  type: Yup.string().required('Required'),
  distance: Yup.number().min(0, 'Must be positive').required('Required'),
  targetTime: Yup.string().required('Required'),
});

const RacePlanner = () => {
  const races = useSelector(state => state.races.data);
  const dispatch = useDispatch();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRace, setEditingRace] = useState(null);

  const inputClass =
    "w-full bg-white dark:bg-[#111827] border-2 border-gray-300 dark:border-[#243244] rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/50 transition-all";

  return (
    <div className="space-y-4 pb-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center animate-in fade-in slide-up">
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-accent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <h1 className="text-2xl font-black text-gray-900 dark:text-white font-display tracking-tight italic uppercase">
            Race Planner
          </h1>
          <p className="text-gray-500 text-sm font-medium ml-1 mt-0.5">
            Countdown to glory. Map out your season.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="shadow-lg hover:scale-105 transition-transform">
          <PlusCircle size={16} className="mr-1.5" />
          Add Race
        </Button>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 gap-3">
        {races.map((race, index) => {
          const daysTo = differenceInDays(parseISO(race.date), new Date());
          const isNext = index === 0 && daysTo > 0;

          return (
            <Card
              key={race.id}
              className={`flex flex-col md:flex-row p-0 overflow-hidden group max-w-4xl mx-auto w-full
                ${isNext ? 'border-accent/40 border-2' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Left Color Bar */}
              <div className={`w-1.5 h-full absolute left-0 top-0 ${isNext ? 'bg-accent' : 'bg-gray-200 dark:bg-gray-800'}`} />

              <div className="flex-1 p-4 md:pr-3 ml-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest border border-accent/20">
                    {race.type}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 text-[9px] font-black uppercase tracking-widest border border-purple-500/20">
                    {race.distance}km
                  </span>
                  {isNext && (
                    <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[9px] font-black uppercase tracking-widest border border-success/20">
                      NEXT UP
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-black text-gray-900 dark:text-white font-display italic uppercase mb-1.5 group-hover:text-accent transition-colors">
                  {race.name}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{format(parseISO(race.date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer size={14} className="text-gray-400" />
                    <span>Target: <span className="text-gray-900 dark:text-white font-bold">{race.targetTime}</span></span>
                  </div>
                </div>
              </div>

              {/* Countdown / Status Section */}
              <div className="md:w-48 flex-shrink-0 bg-gray-50/50 dark:bg-[#1e293b]/20 p-4 flex flex-col items-center justify-center border-l border-gray-100 dark:border-gray-800 relative">
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => setEditingRace(race)}
                    className="p-1.5 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                  >
                    <Save size={14} className="hidden" /> {/* Placeholder for edit2 */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit-2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Remove this race?')) {
                        dispatch(deleteRace(race.id));
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {daysTo >= 0 ? (
                  <div className="text-center">
                    <div className="text-3xl font-black text-accent font-display italic leading-none mb-1">
                      {daysTo}
                    </div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      Days Left
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="p-3 bg-success/10 rounded-xl text-success mb-2">
                      <Flag size={24} />
                    </div>
                    <p className="text-[9px] font-black text-success uppercase tracking-[0.2em]">
                      Completed
                    </p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {races.length === 0 && (
          <div className="text-center py-8 animate-in fade-in zoom-in">
            <div className="inline-flex p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400 mb-3">
              <Flag size={32} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No races planned yet</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-4">
              Set a goal and start working towards it. Add your first race to begin the countdown.
            </p>
            <Button onClick={() => setIsAddModalOpen(true)} size="sm">
              Add Your First Race
            </Button>
          </div>
        )}
      </div>

      {/* RACE MODAL (ADD & EDIT) */}
      {(isAddModalOpen || editingRace) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <Card className="max-w-xl w-full mx-4 p-8 shadow-2xl transform animate-in zoom-in-95 duration-300 !overflow-visible">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white font-display italic uppercase flex items-center gap-3">
                <Flag size={28} className="text-accent" />
                {editingRace ? 'Edit Race' : 'Add New Race'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingRace(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <Formik
              initialValues={editingRace || { name: '', date: '', type: 'Marathon', distance: '', targetTime: '' }}
              validationSchema={RaceSchema}
              onSubmit={(values) => {
                if (editingRace) {
                  dispatch(updateRace(values));
                } else {
                  dispatch(addRace({
                    ...values,
                    id: Math.random().toString(36).substr(2, 9)
                  }));
                }
                setIsAddModalOpen(false);
                setEditingRace(null);
              }}
            >
              {({ errors, touched, values, setFieldValue }) => (
                <Form className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Race Name</label>
                    <Field name="name" type="text" placeholder="e.g. NMDC Marathon" className={inputClass} />
                    {errors.name && touched.name && <div className="text-danger text-[10px] font-bold uppercase">{errors.name}</div>}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Date</label>
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
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Race Type</label>
                      <Field as="select" name="type" className={inputClass}>
                        <option value="Marathon">Marathon</option>
                        <option value="Half Marathon">Half Marathon</option>
                        <option value="10K">10K</option>
                        <option value="5K">5K</option>
                        <option value="Triathlon">Triathlon</option>
                        <option value="Cycling Race">Cycling Race</option>
                        <option value="Other">Other</option>
                      </Field>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Distance (km)</label>
                      <Field name="distance" type="number" className={inputClass} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Target Time</label>
                      <Field name="targetTime" type="text" placeholder="e.g. 3:45:00" className={inputClass} />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setEditingRace(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                    >
                      <Save size={18} className="mr-2" />
                      Add to Plan
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

export default RacePlanner;