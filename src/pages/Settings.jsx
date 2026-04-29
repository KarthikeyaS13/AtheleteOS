import { useSelector, useDispatch } from 'react-redux';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Formik, Form, Field } from 'formik';
import { updateTargets, updateProfile } from '../store/slices/settingsSlice';
import { Download, Upload, Trash2, User, Target } from 'lucide-react';

const Settings = () => {
  const settings = useSelector(state => state.settings);
  const dispatch = useDispatch();

  const handleExportData = () => {
     const data = localStorage.getItem('athletos_data');
     const blob = new Blob([data], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `athletos_backup_${new Date().toISOString().split('T')[0]}.json`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
  };

  const handleImportData = (e) => {
     const file = e.target.files[0];
     if(!file) return;
     const reader = new FileReader();
     reader.onload = (event) => {
        try {
           const json = JSON.parse(event.target.result);
           localStorage.setItem('athletos_data', JSON.stringify(json));
           alert('Data imported successfully! Reloading...');
           window.location.reload();
        } catch (e) {
           alert('Invalid JSON file');
        }
     };
     reader.readAsText(file);
  };

  const handleClearData = () => {
     if(window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.removeItem('athletos_data');
        window.location.reload();
     }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your profile, targets, and data.</p>
      </div>

      <Card>
         <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><User className="text-accent"/> Profile</h2>
         <Formik
            initialValues={settings.profile}
            onSubmit={(values) => {
               dispatch(updateProfile(values));
               alert('Profile saved!');
            }}
         >
            <Form className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-sm text-gray-400">Name</label>
                  <Field name="name" className="w-full bg-background border border-[#334155] rounded-lg px-3 py-2 text-white outline-none focus:border-accent" />
               </div>
               <div className="space-y-2">
                  <label className="text-sm text-gray-400">Age</label>
                  <Field name="age" type="number" className="w-full bg-background border border-[#334155] rounded-lg px-3 py-2 text-white outline-none focus:border-accent" />
               </div>
               <div className="space-y-2">
                  <label className="text-sm text-gray-400">Weight (kg)</label>
                  <Field name="weight" type="number" className="w-full bg-background border border-[#334155] rounded-lg px-3 py-2 text-white outline-none focus:border-accent" />
               </div>
               <div className="space-y-2">
                  <label className="text-sm text-gray-400">Max Heart Rate</label>
                  <Field name="maxHR" type="number" className="w-full bg-background border border-[#334155] rounded-lg px-3 py-2 text-white outline-none focus:border-accent" />
               </div>
               <div className="md:col-span-2">
                  <Button type="submit">Save Profile</Button>
               </div>
            </Form>
         </Formik>
      </Card>

      <Card>
         <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Target className="text-success"/> Weekly Targets</h2>
         <Formik
            initialValues={settings.targets}
            onSubmit={(values) => {
               dispatch(updateTargets(values));
               alert('Targets saved!');
            }}
         >
            <Form className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                  <label className="text-sm text-gray-400">Running (km)</label>
                  <Field name="weeklyRunKm" type="number" className="w-full bg-background border border-[#334155] rounded-lg px-3 py-2 text-white outline-none focus:border-accent" />
               </div>
               <div className="space-y-2">
                  <label className="text-sm text-gray-400">Cycling (km)</label>
                  <Field name="weeklyCycleKm" type="number" className="w-full bg-background border border-[#334155] rounded-lg px-3 py-2 text-white outline-none focus:border-accent" />
               </div>
               <div className="space-y-2">
                  <label className="text-sm text-gray-400">Daily Calories</label>
                  <Field name="dailyCalories" type="number" className="w-full bg-background border border-[#334155] rounded-lg px-3 py-2 text-white outline-none focus:border-accent" />
               </div>
               <div className="md:col-span-3">
                  <Button type="submit">Save Targets</Button>
               </div>
            </Form>
         </Formik>
      </Card>

      <Card>
         <h2 className="text-xl font-bold text-white mb-6">Data Management</h2>
         <div className="flex flex-wrap gap-4">
            <Button onClick={handleExportData} className="bg-[#334155] hover:bg-[#475569] text-white">
               <Download size={18} className="mr-2" /> Export JSON
            </Button>
            
            <label className="cursor-pointer">
               <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
               <div className="inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 bg-[#334155] hover:bg-[#475569] text-white px-4 py-2 text-sm shadow-lg">
                  <Upload size={18} className="mr-2"/> Import JSON
               </div>
            </label>
            
            <Button onClick={handleClearData} variant="danger">
               <Trash2 size={18} className="mr-2" /> Clear All Data
            </Button>
         </div>
      </Card>
      
    </div>
  );
};

export default Settings;
