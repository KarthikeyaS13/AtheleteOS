import { useSelector } from 'react-redux';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { format, subDays } from 'date-fns';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';

const WeeklyReport = () => {
  const workouts = useSelector(state => state.workouts.data);
  const settings = useSelector(state => state.settings);

  // Simple current week filter (last 7 days for demo)
  const today = new Date();
  const weekAgo = subDays(today, 7);
  const weekStartStr = format(weekAgo, 'yyyy-MM-dd');
  
  const weeklyWorkouts = workouts.filter(w => w.date >= weekStartStr);
  const totalLoad = weeklyWorkouts.reduce((sum, w) => sum + (w.loadScore || 0), 0);
  
  const handleExportPDF = () => {
     const doc = new jsPDF();
     doc.setFillColor(15, 23, 42); // bg-background
     doc.rect(0, 0, 210, 297, "F");
     
     doc.setTextColor(255, 255, 255);
     doc.setFontSize(22);
     doc.text(`AthletOS - Weekly Report`, 20, 30);
     
     doc.setFontSize(12);
     doc.setTextColor(148, 163, 184); // text-gray-400
     doc.text(`Athlete: ${settings.profile.name || 'Anonymous'}`, 20, 40);
     doc.text(`Week ending: ${format(today, 'MMMM d, yyyy')}`, 20, 48);
     
     doc.setTextColor(255, 255, 255);
     doc.setFontSize(16);
     doc.text(`Summary statistics:`, 20, 65);
     
     doc.setFontSize(12);
     doc.text(`Total Workouts: ${weeklyWorkouts.length}`, 20, 75);
     doc.text(`Total Training Load: ${Math.round(totalLoad)}`, 20, 83);
     
     // Very simple PDF generation for demonstration
     doc.save(`AthletOS_Report_${format(today, 'yyyy-MM-dd')}.pdf`);
  };

  const handleExportExcel = async () => {
     const workbook = new ExcelJS.Workbook();
     const sheet = workbook.addWorksheet('Weekly Workouts');
     
     sheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Sport', key: 'sport', width: 20 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Distance', key: 'distance', width: 15 },
        { header: 'Duration', key: 'duration', width: 15 },
        { header: 'Load Score', key: 'loadScore', width: 15 },
        { header: 'Notes', key: 'notes', width: 40 }
     ];
     
     weeklyWorkouts.forEach(w => sheet.addRow(w));
     
     // Styling headers
     sheet.getRow(1).font = { bold: true };
     
     const buffer = await workbook.xlsx.writeBuffer();
     const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `AthletOS_Report_${format(today, 'yyyy-MM-dd')}.xlsx`;
     a.click();
     URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Weekly Report</h1>
        <p className="text-gray-400 mt-1">Summary of your last 7 days of training.</p>
      </div>

      <Card className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 bg-gradient-to-br from-surface to-surface/50">
         <div>
            <h2 className="text-2xl font-bold text-white mb-2">Week ending {format(today, 'MMM d, yyyy')}</h2>
            <div className="flex gap-4 mt-4">
               <div>
                  <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Total Sessions</p>
                  <p className="text-3xl font-bold text-accent">{weeklyWorkouts.length}</p>
               </div>
               <div className="w-px bg-[#334155]"></div>
               <div>
                  <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Total Load</p>
                  <p className="text-3xl font-bold text-success">{Math.round(totalLoad)}</p>
               </div>
            </div>
         </div>
         <div className="mt-8 md:mt-0 flex flex-col sm:flex-row gap-4">
            <Button onClick={handleExportPDF} size="lg" className="bg-danger hover:bg-danger/90">
               <FileText size={18} className="mr-2" />
               Export PDF
            </Button>
            <Button onClick={handleExportExcel} size="lg" className="bg-[#22c55e] hover:bg-[#22c55e]/90 shadow-[#22c55e]/20">
               <Download size={18} className="mr-2" />
               Export Excel
            </Button>
         </div>
      </Card>
      
      <h3 className="text-white font-bold text-xl mt-8 mb-4">Workout Log</h3>
      <div className="space-y-4">
         {weeklyWorkouts.map(w => (
            <div key={w.id} className="flex justify-between items-center p-4 bg-background border border-[#334155] rounded-xl hover:border-accent transition-colors">
               <div>
                  <p className="font-bold text-white mb-1">{w.sport} - {w.type}</p>
                  <p className="text-sm text-gray-400">{format(new Date(w.date), 'MMM d')} • {w.distance ? w.distance+'km' : ''} {w.duration}</p>
               </div>
               <div className="text-right border-l border-[#334155] pl-4">
                  <p className="text-sm text-gray-400">Load</p>
                  <p className="font-bold text-accent text-lg">{w.loadScore}</p>
               </div>
            </div>
         ))}
         {weeklyWorkouts.length === 0 && <p className="text-gray-500 italic">No workouts found for this period.</p>}
      </div>

    </div>
  );
};

export default WeeklyReport;
