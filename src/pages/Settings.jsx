import { useSelector, useDispatch } from 'react-redux';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Formik, Form, Field } from 'formik';
import { updateTargets, updateProfile } from '../store/slices/settingsSlice';
import { Download, Upload, Trash2, User, Target } from 'lucide-react';
import jsPDF from 'jspdf'
import autoTable from "jspdf-autotable";

const Settings = () => {
   const settings = useSelector(state => state.settings);
   const dispatch = useDispatch();

   const inputClass =
      "w-full bg-white dark:bg-[#111827] border-2 border-gray-300 dark:border-[#243244] rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/50 hover:border-gray-400 dark:hover:border-[#2d3a4f] transition-colors shadow-sm";

   const handleExportData = () => {
      const { profile, targets } = settings;

      const doc = new jsPDF();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("Athlete Report", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("Generated from AthleteOS", 14, 26);

      autoTable(doc, {
         startY: 35,
         head: [["Profile Details", ""]],
         body: [
            ["Name", profile.name || "-"],
            ["Age", profile.age || "-"],
            ["Weight", `${profile.weight || "-"} kg`],
            ["Max HR", profile.maxHR || "-"],
         ],
         columnStyles: {
            0: { cellWidth: 80, fontStyle: 'bold' },
            1: { cellWidth: 100 },
         },
         theme: "grid",
         styles: {
            fontSize: 11,
            cellPadding: 4,
         },
         headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: "bold",
         },
         alternateRowStyles: {
            fillColor: [245, 247, 250],
         },
      });

      autoTable(doc, {
         startY: doc.lastAutoTable.finalY + 5,
         head: [["Weekly Targets", ""]],
         body: [
            ["Running", `${targets.weeklyRunKm || "-"} km`],
            ["Cycling", `${targets.weeklyCycleKm || "-"} km`],
            ["Calories", targets.dailyCalories || "-"],
         ],
         columnStyles: {
            0: { cellWidth: 80, fontStyle: 'bold' },
            1: { cellWidth: 100 },

         },
         theme: "grid",
         styles: {
            fontSize: 11,
            cellPadding: 4,
         },
         headStyles: {
            fillColor: [34, 197, 94],
            textColor: 255,
            fontStyle: "bold",
         },
         alternateRowStyles: {
            fillColor: [245, 247, 250],
         },
      });

      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.setFont('helvetica', 'bold')
      doc.text(
         `Exported: ${new Date().toLocaleString()}`,
         14,
         doc.lastAutoTable.finalY + 15
      );

      doc.save(`Athlete_Report_${new Date().toISOString().split("T")[0]}.pdf`);
   };
   //To see user data in text format 
   // const handleExportData = () => {
   //    const { profile, targets } = settings
   //    const content = `
   //       ATHLETE PROFILE 
   //       --------------------------------------------

   //       Name: ${profile.name || '-'}
   //       Age: ${profile.age || '-'}
   //       Weight: ${profile.weight || '-'}
   //       Max Heart Rate: ${profile.maxHR || '-'}

   //       Weekly Targets 
   //       --------------------------------------------

   //       Running: ${targets.weeklyRunKm || "-"} km
   //       Cycling: ${targets.weeklyCycleKm || "-"} km
   //       Calories: ${targets.dailyCalories || "-"}

   //       Exported on: ${new Date().toLocaleString()}
   //    `;

   //    const blob = new Blob([content], { type: "text/plain" });
   //    const url = URL.createObjectURL(blob)
   //    const a = document.createElement('a');
   //    a.href = url
   //    a.download = `Athlete_Profile_${new Date().toISOString().split("T")[0]}.pdf`;

   //    document.body.appendChild(a);
   //    a.click()
   //    document.body.removeChild(a);
   // }

   const handleImportData = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
         try {
            const json = JSON.parse(event.target.result);
            localStorage.setItem('athletos_data', JSON.stringify(json));
            alert('Data imported successfully! Reloading...');
            window.location.reload();
         } catch (e) {
            alert('Invalid JSON file', e);
         }
      };
      reader.readAsText(file);
   };

   const handleClearData = () => {
      if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
         localStorage.removeItem('athletos_data');
         window.location.reload();
      }
   };

   return (
      <div className="space-y-6 max-w-4xl mx-auto">

         {/* Header */}
         <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
               Settings
            </h1>
            <p className="text-gray-700 dark:text-gray-400 mt-1">
               Manage your profile, targets, and data.
            </p>
         </div>

         {/* Profile */}
         <Card className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-xl p-6 shadow-md dark:shadow-none">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
               <User className="text-accent" /> Profile
            </h2>

            <Formik
               initialValues={settings.profile}
               onSubmit={(values) => {
                  dispatch(updateProfile(values));
                  alert('Profile saved!');
               }}
            >
               <Form className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-800 dark:text-white">Full Name</label>
                     <Field name="name" className={inputClass} />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-800 dark:text-white">Age</label>
                     <Field name="age" type="number" className={inputClass} />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-800 dark:text-white">Weight (kg)</label>
                     <Field name="weight" type="number" className={inputClass} />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-800 dark:text-white">Max Heart Rate</label>
                     <Field name="maxHR" type="number" className={inputClass} />
                  </div>

                  <div className="md:col-span-2">
                     <Button className="bg-accent text-white hover:bg-accent/90 shadow-md">
                        Save Profile
                     </Button>
                  </div>

               </Form>
            </Formik>
         </Card>

         {/* Targets */}
         <Card className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-xl p-6 shadow-md dark:shadow-none">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
               <Target className="text-success" /> Weekly Targets
            </h2>

            <Formik
               initialValues={settings.targets}
               onSubmit={(values) => {
                  dispatch(updateTargets(values));
                  alert('Targets saved!');
               }}
            >
               <Form className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-800 dark:text-white">Running (km)</label>
                     <Field name="weeklyRunKm" type="number" className={inputClass} />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-800 dark:text-white">Cycling (km)</label>
                     <Field name="weeklyCycleKm" type="number" className={inputClass} />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-800 dark:text-white">Daily Calories</label>
                     <Field name="dailyCalories" type="number" className={inputClass} />
                  </div>

                  <div className="md:col-span-3">
                     <Button className="bg-accent text-white hover:bg-accent/90 shadow-md">
                        Save Targets
                     </Button>
                  </div>

               </Form>
            </Formik>
         </Card>

         {/* Data */}
         <Card className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-xl p-6 shadow-md dark:shadow-none">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
               Data Management
            </h2>

            <div className="flex flex-wrap gap-4">

               <Button className="bg-blue-500 text-white hover:bg-blue-600 shadow-md" onClick={handleExportData}>
                  <Download size={18} className="mr-2" /> Download Report
               </Button>

               <label className="cursor-pointer">
                  <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                  <div className="inline-flex items-center rounded-xl px-4 py-2 text-sm bg-gray-700 hover:bg-gray-800 text-white shadow-md">
                     <Upload size={18} className="mr-2" /> Import JSON
                  </div>
               </label>

               <Button variant="danger" onClick={handleClearData}>
                  <Trash2 size={18} className="mr-2" /> Clear All Data
               </Button>

            </div>
         </Card>

      </div>
   );
};

export default Settings;