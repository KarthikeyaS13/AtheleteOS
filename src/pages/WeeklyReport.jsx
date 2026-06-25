import { useSelector } from 'react-redux';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { format, subDays } from 'date-fns';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

const WeeklyReport = () => {
   const workouts = useSelector(state => state.workouts.data);

   const today = new Date();
   const weekAgo = subDays(today, 7);
   const weekStartStr = format(weekAgo, 'yyyy-MM-dd');

   const weeklyWorkouts = workouts.filter(w => w.date >= weekStartStr);
   const totalLoad = weeklyWorkouts.reduce((sum, w) => sum + (w.loadScore || 0), 0);

   const handleExportPDF = () => {
      const doc = new jsPDF();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("Weekly Training Report", 14, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-505
      doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 14, 26);
      doc.text(`Period: last 7 days ending ${format(today, 'MMM d, yyyy')}`, 14, 31);

      // Add a line separator
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(14, 36, 196, 36);

      // Summary details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("SUMMARY", 14, 45);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Total Sessions: ${weeklyWorkouts.length}`, 14, 52);
      doc.text(`Total Training Load: ${Math.round(totalLoad)}`, 14, 58);

      const tableData = weeklyWorkouts.map(w => [
         format(new Date(w.date), 'yyyy-MM-dd'),
         w.sport,
         w.type,
         w.duration || '-',
         w.distance ? `${w.distance} km` : '-',
         w.loadScore || '0'
      ]);

      autoTable(doc, {
         startY: 65,
         head: [["Date", "Sport", "Type", "Duration", "Distance", "Load Score"]],
         body: tableData,
         theme: "grid",
         styles: {
            fontSize: 10,
            cellPadding: 5,
         },
         headStyles: {
            fillColor: [59, 130, 246], // blue-500
            textColor: 255,
            fontStyle: "bold",
         },
         alternateRowStyles: {
            fillColor: [248, 250, 252], // slate-50
         },
      });

      doc.save(`Weekly_Report_${format(today, 'yyyy-MM-dd')}.pdf`);
   };

   const handleExportExcel = async () => {
      try {
         const workbook = new ExcelJS.Workbook();
         const worksheet = workbook.addWorksheet('Weekly Report');

         // Title & Summary info
         worksheet.addRow(['Weekly Training Report']);
         worksheet.addRow([`Period: Last 7 days ending ${format(today, 'MMM d, yyyy')}`]);
         worksheet.addRow([`Total Sessions: ${weeklyWorkouts.length}`]);
         worksheet.addRow([`Total Load: ${Math.round(totalLoad)}`]);
         worksheet.addRow([]); // Empty row

         // Header Row
         const headerRow = worksheet.addRow(['Date', 'Sport', 'Type', 'Duration', 'Distance (km)', 'Load Score']);
         headerRow.font = { bold: true };

         // Data Rows
         weeklyWorkouts.forEach(w => {
            worksheet.addRow([
               format(new Date(w.date), 'yyyy-MM-dd'),
               w.sport,
               w.type,
               w.duration || '-',
               w.distance || '-',
               w.loadScore || 0
            ]);
         });

         // Column widths
         worksheet.getColumn(1).width = 15; // Date
         worksheet.getColumn(2).width = 15; // Sport
         worksheet.getColumn(3).width = 20; // Type
         worksheet.getColumn(4).width = 15; // Duration
         worksheet.getColumn(5).width = 15; // Distance
         worksheet.getColumn(6).width = 15; // Load Score

         // Style Title
         worksheet.getCell('A1').font = { size: 16, bold: true };

         const buffer = await workbook.xlsx.writeBuffer();
         const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
         const url = window.URL.createObjectURL(blob);
         const anchor = document.createElement('a');
         anchor.href = url;
         anchor.download = `Weekly_Report_${format(today, 'yyyy-MM-dd')}.xlsx`;
         anchor.click();
         window.URL.revokeObjectURL(url);
      } catch (err) {
         console.error('Error generating Excel:', err);
         alert('Failed to generate Excel report.');
      }
   };

   return (
      <div className="space-y-4 max-w-2xl mx-auto">

         {/* Header */}
         <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
               Weekly Report
            </h1>
            <p className="text-gray-700 dark:text-gray-400 mt-1 text-sm">
               Summary of your last 7 days of training.
            </p>
         </div>

         <Card className="flex flex-col md:flex-row justify-between items-start md:items-center p-4
         bg-white dark:bg-[#111827]
         border border-gray-200 dark:border-[#243244]">

            <div>
               <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Week ending {format(today, 'MMM d, yyyy')}
               </h2>

               <div className="flex gap-4 mt-2">

                  <div>
                     <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-bold">
                        Total Sessions
                     </p>
                     <p className="text-2xl font-bold text-accent">
                        {weeklyWorkouts.length}
                     </p>
                  </div>

                  <div className="w-px bg-gray-200 dark:bg-[#243244]"></div>

                  <div>
                     <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-bold">
                        Total Load
                     </p>
                     <p className="text-2xl font-bold text-success">
                        {Math.round(totalLoad)}
                     </p>
                  </div>

               </div>
            </div>

            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
               <Button size="sm" className="bg-danger hover:bg-danger/90" onClick={handleExportPDF}>
                  <FileText size={16} className="mr-1.5" />
                  Export PDF
               </Button>

               <Button size="sm" className="bg-success hover:bg-success/90" onClick={handleExportExcel}>
                  <Download size={16} className="mr-1.5" />
                  Export Excel
               </Button>
            </div>
         </Card>

         {/* Workout Log */}
         <h3 className="text-gray-900 dark:text-white font-bold text-lg mt-4 mb-2">
            Workout Log
         </h3>

         <div className="space-y-4">
            {weeklyWorkouts.map(w => (
               <div
                  key={w.id}
                  className="flex justify-between items-center py-2 px-3 rounded-xl
                  bg-white dark:bg-[#111827]
                  border border-gray-200 dark:border-[#243244]
                  hover:border-accent transition-colors"
               >

                  <div>
                     <p className="font-bold text-gray-900 dark:text-white mb-0.5 text-sm">
                        {w.sport} - {w.type}
                     </p>

                     <p className="text-xs text-gray-600 dark:text-gray-400">
                        {format(new Date(w.date), 'MMM d')} • {w.distance ? w.distance + 'km' : ''} {w.duration}
                     </p>
                  </div>

                  <div className="text-right border-l border-gray-200 dark:border-[#243244] pl-3">
                     <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase">
                        Load
                     </p>
                     <p className="font-bold text-accent text-base">
                        {w.loadScore}
                     </p>
                  </div>

               </div>
            ))}

            {weeklyWorkouts.length === 0 && (
               <p className="text-gray-500 dark:text-gray-400 italic text-sm">
                  No workouts found for this period.
               </p>
            )}
         </div>

      </div>
   );
};

export default WeeklyReport;