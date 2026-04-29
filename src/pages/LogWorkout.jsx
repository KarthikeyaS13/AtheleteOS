import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { addWorkout } from '../store/slices/workoutsSlice';
import { calculateTrainingLoad } from '../utils/calculations';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Save, Activity, Bike, Dumbbell, Droplet } from 'lucide-react';
// We'd use uuid for real IDs, generating simple unique string here
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

  const sports = [
    { name: 'Running', icon: <Activity size={20} className="mr-2" /> },
    { name: 'Cycling', icon: <Bike size={20} className="mr-2" /> },
    { name: 'Strength Training', icon: <Dumbbell size={20} className="mr-2" /> },
    { name: 'Swimming', icon: <Droplet size={20} className="mr-2" /> }
  ];

  const getInitialValues = () => {
    return {
      date: new Date().toISOString().split('T')[0],
      type: '',
      distance: '',
      duration: '00:00:00',
      rpe: 5,
      notes: '',
      sport: activeTab
    };
  };

  const LiveLoadPreview = ({ values }) => {
    const load = calculateTrainingLoad(activeTab, Number(values.distance), values.duration, Number(values.rpe));
    return (
      <div className="bg-background border border-[#334155] rounded-xl p-4 flex justify-between items-center mt-6">
        <div>
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Calculated Load</h4>
          <p className="text-xs text-gray-500">Based on RPE and Volume</p>
        </div>
        <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-purple-500">
          {load || 0}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Log Workout</h1>
        <p className="text-gray-400 mt-2">Enter your session details. Training load is calculated automatically.</p>
      </div>

      <div className="flex space-x-2 p-1 bg-surface rounded-xl border border-[#334155]">
        {sports.map(sport => (
          <button
            key={sport.name}
            onClick={() => setActiveTab(sport.name)}
            className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === sport.name 
                ? 'bg-[#334155] text-white shadow-md' 
                : 'text-gray-400 hover:text-white hover:bg-[#334155]/50'
            }`}
          >
            {sport.icon}
            {sport.name}
          </button>
        ))}
      </div>

      <Card>
        <Formik
          enableReinitialize
          initialValues={getInitialValues()}
          validationSchema={WorkoutSchema}
          onSubmit={(values, { resetForm }) => {
            const loadScore = calculateTrainingLoad(activeTab, Number(values.distance), values.duration, Number(values.rpe));
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
          {({ errors, touched, values, handleChange }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Date</label>
                  <Field 
                    name="date" 
                    type="date" 
                    className="w-full bg-background border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                  {errors.date && touched.date && <div className="text-danger text-xs">{errors.date}</div>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Type</label>
                  <Field 
                    as="select"
                    name="type" 
                    className="w-full bg-background border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors appearance-none"
                  >
                    <option value="">Select type...</option>
                    <option value="Base">Base / Easy</option>
                    <option value="Tempo">Tempo / Sweet Spot</option>
                    <option value="Threshold">Threshold</option>
                    <option value="VO2Max">VO2 Max / Interval</option>
                    <option value="Long">Long Endurance</option>
                    <option value="Recovery">Recovery</option>
                    <option value="Race">Race</option>
                  </Field>
                </div>

                {activeTab !== 'Strength Training' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Distance {activeTab === 'Swimming' ? '(meters)' : '(km)'}
                    </label>
                    <Field 
                      name="distance" 
                      type="number" 
                      step="any"
                      placeholder="e.g. 5.5"
                      className="w-full bg-background border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    />
                    {errors.distance && touched.distance && <div className="text-danger text-xs">{errors.distance}</div>}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Duration {activeTab === 'Strength Training' ? '(minutes)' : '(HH:MM:SS)'}
                  </label>
                  <Field 
                    name="duration" 
                    type="text" 
                    placeholder={activeTab === 'Strength Training' ? "e.g. 45" : "e.g. 00:45:00"}
                    className="w-full bg-background border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                  {errors.duration && touched.duration && <div className="text-danger text-xs">{errors.duration}</div>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-gray-300">RPE (Rate of Perceived Exertion)</label>
                    <span className="text-accent font-bold">{values.rpe} / 10</span>
                  </div>
                  <Field 
                    name="rpe" 
                    type="range" 
                    min="1" max="10" step="1"
                    className="w-full accent-accent h-2 bg-[#334155] rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 (Very Easy)</span>
                    <span>10 (Maximum)</span>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-300">Notes</label>
                  <Field 
                    as="textarea"
                    name="notes" 
                    rows="3"
                    placeholder="How did you feel? Weather conditions? Nutrition used?"
                    className="w-full bg-background border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none"
                  />
                </div>

              </div>

              <LiveLoadPreview values={values} />

              <div className="pt-4 flex justify-end">
                <Button type="submit" size="lg" className="w-full md:w-auto">
                  <Save size={18} className="mr-2" />
                  Save {activeTab} Workout
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
