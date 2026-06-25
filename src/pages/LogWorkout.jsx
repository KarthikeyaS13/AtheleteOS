import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { addWorkout } from '../store/slices/workoutsSlice';
import { calculateTrainingLoad } from '../utils/calculations';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Save, Activity, Bike, Dumbbell, Droplet } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { parseISO, format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";

const generateId = () => Math.random().toString(36).substr(2, 9);

const WorkoutSchema = Yup.object().shape({
  date: Yup.date().required('Required'),
  distance: Yup.number().min(0, 'Must be positive').when('sport', {
    is: (val) => val === 'Running' || val === 'Cycling' || val === 'Swimming',
    then: () => Yup.number().required('Required')
  }),
  duration: Yup.string().required('Required'),
  rpe: Yup.number().min(1).max(10).required('Required'),
});

const LogWorkout = () => {
  const [activeTab, setActiveTab] = useState('Running');
  const dispatch = useDispatch();

  const inputClass =
    "w-full bg-white dark:bg-[#111827] border-2 border-gray-300 dark:border-[#243244] rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/50 hover:border-gray-400 dark:hover:border-[#2d3a4f] transition-colors shadow-sm";

  const sports = [
    { name: 'Running', icon: <Activity size={20} className="mr-2" /> },
    { name: 'Cycling', icon: <Bike size={20} className="mr-2" /> },
    { name: 'Strength Training', icon: <Dumbbell size={20} className="mr-2" /> },
    { name: 'Swimming', icon: <Droplet size={20} className="mr-2" /> }
  ];

  const getInitialValues = () => ({
    date: new Date().toISOString().split('T')[0],
    type: '',
    distance: '',
    duration: '00:00:00',
    rpe: 5,
    notes: '',
    sport: activeTab
  });

  const LiveLoadPreview = ({ values }) => {
    const load = calculateTrainingLoad(
      activeTab,
      Number(values.distance),
      values.duration,
      Number(values.rpe)
    );

    return (
      <div className="bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-[#243244] rounded-xl p-4 flex justify-between items-center mt-6">
        <div>
          <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wider">
            Calculated Load
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Based on RPE and Volume
          </p>
        </div>
        <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-purple-500">
          {load || 0}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-5">

      {/* Header */}
      <div className="animate-in fade-in slide-up">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white font-display tracking-tight italic uppercase">
          Log Workout
        </h1>
        <p className="text-gray-500 font-medium mt-1 text-sm">
          Enter your session details. Training load is calculated automatically.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 animate-in fade-in slide-up" style={{ animationDelay: '100ms' }}>
        {sports.map(sport => (
          <button
            key={sport.name}
            onClick={() => setActiveTab(sport.name)}
            className={`
              flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all duration-300
              ${activeTab === sport.name
                ? 'bg-white dark:bg-gray-700 text-accent shadow-md'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800'
              }
            `}
          >
            {sport.icon}
            {sport.name}
          </button>
        ))}
      </div>

      {/* Form Card */}
      <Card className="p-5" style={{ animationDelay: '200ms' }}>
        <Formik
          enableReinitialize
          initialValues={getInitialValues()}
          validationSchema={WorkoutSchema}
          onSubmit={(values, { resetForm }) => {
            const loadScore = calculateTrainingLoad(
              activeTab,
              Number(values.distance),
              values.duration,
              Number(values.rpe)
            );

            const submission = {
              ...values,
              id: generateId(),
              sport: activeTab,
              loadScore
            };

            dispatch(addWorkout(submission));
            resetForm();
          }}
        >
          {({ errors, touched, values, setFieldValue }) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Date</label>
                  <DatePicker
                    selected={values.date ? parseISO(values.date) : null}
                    onChange={(date) => setFieldValue('date', date ? format(date, 'yyyy-MM-dd') : '')}
                    dateFormat="dd/MM/yyyy"
                    className={inputClass}
                    placeholderText="DD/MM/YYYY"
                  />
                  {errors.date && touched.date && <div className="text-danger text-[10px] font-bold uppercase">{errors.date}</div>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Workout Type</label>
                  <Field as="select" name="type" className={inputClass}>
                    <option value="">Select type...</option>
                    <option value="Base">Base / Easy</option>
                    <option value="Tempo">Tempo</option>
                    <option value="Threshold">Threshold</option>
                    <option value="VO2Max">VO2 Max</option>
                    <option value="Long">Long</option>
                    <option value="Recovery">Recovery</option>
                    <option value="Race">Race</option>
                  </Field>
                </div>

                {activeTab !== 'Strength Training' && (
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Distance (km)</label>
                    <Field name="distance" type="number" className={inputClass} />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Duration (HH:MM:SS)</label>
                  <Field name="duration" type="time" step="1" className={inputClass} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Perceived Effort (RPE)</label>
                    <span className="text-base font-black text-accent font-display italic">{values.rpe} / 10</span>
                  </div>
                  <Field type="range" name="rpe" min="1" max="10" className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-accent" />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Notes</label>
                  <Field as="textarea" name="notes" className={`${inputClass} min-h-[70px] resize-none`} placeholder="How did it feel?" />
                </div>
              </div>

              <div className="animate-in fade-in zoom-in" style={{ animationDelay: '400ms' }}>
                <LiveLoadPreview values={values} />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" size="sm" className="px-8 py-2 text-base">
                  <Save size={18} className="mr-2" />
                  Save Workout
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );

};

export default LogWorkout;