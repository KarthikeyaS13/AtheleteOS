import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { addWorkout } from '../store/slices/workoutsSlice';
import { calculateTrainingLoad } from '../utils/calculations';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Save, Activity, Bike, Dumbbell, Droplet } from 'lucide-react';

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
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-700 dark:text-white">
          Log Workout
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Enter your session details. Training load is calculated automatically.
        </p>
      </div>

      {/* Tabs */}
      <div className=" shadow shadow-sm flex space-x-2 p-1 rounded-xl bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-[#243244]">
        {sports.map(sport => (
          <button
            key={sport.name}
            onClick={() => setActiveTab(sport.name)}
            className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === sport.name
              ? 'bg-gray-600 dark:bg-[#334155] text-white shadow-md'
              : 'text-gray-700 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
          >
            {sport.icon}
            {sport.name}
          </button>
        ))}
      </div>

      {/* Card */}
      <Card className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-xl p-6 shadow-md dark:shadow-none">

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
            alert("Workout Logged!");
            resetForm();
          }}
        >
          {({ errors, touched, values }) => (
            <Form className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800 dark:text-white">
                    Date
                  </label>
                  <Field name="date" type="date" className={inputClass} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800 dark:text-white">
                    Type
                  </label>
                  <Field as="select" name="type" className={`${inputClass} appearance-none`}>
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800 dark:text-white">
                      Distance
                    </label>
                    <Field name="distance" type="number" className={inputClass} />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800 dark:text-white">
                    Duration
                  </label>
                  <Field name="duration" type="text" className={inputClass} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-800 dark:text-white">
                    RPE
                  </label>
                  <Field type="range" name="rpe" min="1" max="10" className="w-full" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-800 dark:text-white">
                    Notes
                  </label>
                  <Field as="textarea" name="notes" className={inputClass} />
                </div>

              </div>

              <LiveLoadPreview values={values} />

              <div className="pt-4 flex justify-end">
                <Button type="submit" size="lg">
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