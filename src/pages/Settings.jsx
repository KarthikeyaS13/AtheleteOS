import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { api } from '../utils/api';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Formik, Form, Field } from 'formik';
import { updateTargets, updateProfile } from '../store/slices/settingsSlice';
import { fetchWorkouts } from '../store/slices/workoutsSlice';
import {
  fetchStravaStatus,
  disconnectStrava,
  syncStravaActivities,
  clearStravaError
} from '../store/slices/stravaSlice';
import {
  Download,
  Trash2,
  User,
  Target,
  RefreshCw,
  Link2,
  Link2Off,
  Loader2,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Calendar,
  X
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Settings = () => {
  const settings = useSelector(state => state.settings);
  const strava = useSelector(state => state.strava);
  const dispatch = useDispatch();

  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [mockConnecting, setMockConnecting] = useState(false);

  // Inline toast state for premium notifications
  const [notification, setNotification] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  useEffect(() => {
    dispatch(fetchStravaStatus());
  }, [dispatch]);

  const triggerNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleConnectStrava = () => {
    if (!strava.clientId) {
      setShowConfigModal(true);
      return;
    }
    const redirectUri = `${window.location.origin}/strava/callback`;
    const scope = 'read,activity:read_all';
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${strava.clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&approval_prompt=force`;
  };

  const handleConnectMockStrava = async () => {
    setMockConnecting(true);
    try {
      await api.post('/strava/connect', { code: 'mock_code' });
      triggerNotification('success', 'Mock Strava Account connected successfully!');
      dispatch(fetchStravaStatus());
      dispatch(fetchWorkouts());
    } catch (err) {
      triggerNotification('error', `Failed to connect mock Strava: ${err.message}`);
    } finally {
      setMockConnecting(false);
    }
  };

  const handleDisconnectStrava = async () => {
    setShowConfirmDisconnect(false);
    setDisconnecting(true);
    try {
      await dispatch(disconnectStrava()).unwrap();
      triggerNotification('success', 'Strava account disconnected successfully!');
    } catch (err) {
      triggerNotification('error', `Failed to disconnect: ${err}`);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSyncStrava = async () => {
    setSyncing(true);
    try {
      const res = await dispatch(syncStravaActivities({ isAuto: false })).unwrap();
      triggerNotification('success', `Sync completed! Imported ${res.syncedCount} new activities.`);
    } catch (err) {
      triggerNotification('error', `Failed to sync activities: ${err}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleExportData = () => {
    const { profile, targets } = settings;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Athlete Report', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text('Generated from AthleteOS', 14, 26);

    autoTable(doc, {
      startY: 35,
      head: [['Profile Details', '']],
      body: [
        ['Name', profile.name || '-'],
        ['Age', profile.age || '-'],
        ['Weight', `${profile.weight || '-'} kg`],
        ['Max HR', profile.maxHR || '-']
      ],
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 100 }
      },
      theme: 'grid',
      styles: {
        fontSize: 11,
        cellPadding: 4
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      }
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      head: [['Weekly Targets', '']],
      body: [
        ['Running', `${targets.weeklyRunKm || '-'} km`],
        ['Cycling', `${targets.weeklyCycleKm || '-'} km`],
        ['Calories', targets.dailyCalories || '-']
      ],
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 100 }
      },
      theme: 'grid',
      styles: {
        fontSize: 11,
        cellPadding: 4
      },
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      }
    });

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.setFont('helvetica', 'bold');
    doc.text(`Exported: ${new Date().toLocaleString()}`, 14, doc.lastAutoTable.finalY + 15);

    doc.save(`Athlete_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleClearData = async () => {
    setShowConfirmClear(false);
    try {
      await api.post('/settings/clear-data');
      triggerNotification('success', 'All data cleared successfully! Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Failed to clear data.');
    }
  };

  const inputClass =
    'w-full bg-white dark:bg-[#111827] border-2 border-gray-300 dark:border-[#243244] rounded-xl px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-550 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/50 hover:border-gray-400 dark:hover:border-[#2d3a4f] transition-colors shadow-sm text-sm';

  return (
    <div className="max-w-4xl mx-auto space-y-4 relative">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-in fade-in slide-down duration-200 ${
            notification.type === 'success'
              ? 'bg-success/15 border-success text-success dark:bg-success/10'
              : 'bg-danger/15 border-danger text-danger dark:bg-danger/10'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-700 dark:text-gray-400 mt-0.5 text-sm">
          Manage your profile, targets, and data integrations.
        </p>
      </div>

      {/* Compact Side-by-side grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profile */}
        <Card className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-xl p-4 shadow-md dark:shadow-none h-fit">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <User className="text-accent" /> Profile
          </h2>

          <Formik
            initialValues={settings.profile}
            enableReinitialize={true}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                await dispatch(updateProfile(values)).unwrap();
                triggerNotification('success', 'Profile saved successfully!');
              } catch (err) {
                triggerNotification('error', `Failed to save profile: ${err}`);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-800 dark:text-white">Full Name</label>
                <Field name="name" className={inputClass} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-800 dark:text-white">Age</label>
                <Field name="age" type="number" className={inputClass} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-800 dark:text-white">Weight (kg)</label>
                <Field name="weight" type="number" className={inputClass} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-800 dark:text-white">Max Heart Rate</label>
                <Field name="maxHR" type="number" className={inputClass} />
              </div>

              <div className="sm:col-span-2 mt-1">
                <Button type="submit" size="sm" className="bg-accent text-white hover:bg-accent/90 shadow-md w-full sm:w-auto">
                  Save Profile
                </Button>
              </div>
            </Form>
          </Formik>
        </Card>

        <div className="space-y-4">
          {/* Targets */}
          <Card className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-xl p-4 shadow-md dark:shadow-none h-fit">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Target className="text-success" /> Weekly Targets
            </h2>

            <Formik
              initialValues={settings.targets}
              enableReinitialize={true}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  await dispatch(updateTargets(values)).unwrap();
                  triggerNotification('success', 'Targets saved successfully!');
                } catch (err) {
                  triggerNotification('error', `Failed to save targets: ${err}`);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <Form className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-800 dark:text-white">Running (km)</label>
                  <Field name="weeklyRunKm" type="number" className={inputClass} />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-800 dark:text-white">Cycling (km)</label>
                  <Field name="weeklyCycleKm" type="number" className={inputClass} />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-800 dark:text-white">Daily Calories</label>
                  <Field name="dailyCalories" type="number" className={inputClass} />
                </div>

                <div className="sm:col-span-3 mt-1">
                  <Button type="submit" size="sm" className="bg-accent text-white hover:bg-accent/90 shadow-md w-full sm:w-auto">
                    Save Targets
                  </Button>
                </div>
              </Form>
            </Formik>
          </Card>

          {/* Data Management */}
          <Card className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-xl p-4 shadow-md dark:shadow-none h-fit">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Data Management</h2>

            <div className="flex flex-wrap gap-3">
              <Button size="sm" className="bg-blue-500 text-white hover:bg-blue-600 shadow-md flex-1 sm:flex-initial" onClick={handleExportData}>
                <Download size={16} className="mr-1.5" /> Download Report
              </Button>

              <Button size="sm" variant="danger" className="flex-1 sm:flex-initial" onClick={() => setShowConfirmClear(true)}>
                <Trash2 size={16} className="mr-1.5" /> Clear All Data
              </Button>
            </div>
          </Card>

          {/* Integrations */}
          <Card className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-xl p-4 shadow-md dark:shadow-none h-fit animate-in fade-in slide-up duration-300" style={{ animationDelay: '100ms' }}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center justify-between">
              <span>Integrations</span>
              <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 dark:bg-orange-500/20">Strava</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Link your Strava account to sync your runs, cycles, swims and other stats directly to your dashboard.
            </p>

            {strava.loading ? (
              <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span>Checking integration status...</span>
              </div>
            ) : strava.connected ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-3.5 bg-gray-50 dark:bg-slate-800/40 border border-gray-150 dark:border-[#243244] rounded-xl">
                  {strava.athlete?.profile ? (
                    <img
                      src={strava.athlete.profile}
                      alt="Strava Athlete Profile"
                      className="w-12 h-12 rounded-full border border-orange-500/20 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 dark:bg-orange-500/25 flex items-center justify-center text-orange-500 font-extrabold text-lg shadow-inner">
                      {strava.athlete?.firstname?.[0] || 'S'}
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      {strava.athlete?.firstname
                        ? `${strava.athlete.firstname} ${strava.athlete.lastname || ''}`
                        : 'Strava Athlete'}
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    </div>
                    {strava.athlete?.username && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        @{strava.athlete.username}
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 text-[10px] text-gray-450 dark:text-gray-500 font-medium mt-1.5">
                      {(strava.athlete?.city || strava.athlete?.country) && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {[strava.athlete.city, strava.athlete.state, strava.athlete.country]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      )}
                      {strava.athlete?.lastSync && (
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          Last Synced: {new Date(strava.athlete.lastSync).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Button
                    size="sm"
                    onClick={handleSyncStrava}
                    disabled={syncing}
                    className="bg-orange-500 text-white hover:bg-orange-600 shadow-md flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                  >
                    {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                    {syncing ? 'Syncing...' : 'Sync Activities'}
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setShowConfirmDisconnect(true)}
                    disabled={disconnecting}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                  >
                    {disconnecting ? <Loader2 size={15} className="animate-spin" /> : <Link2Off size={15} />}
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-500/5 dark:bg-orange-500/10 p-2.5 rounded-lg border border-orange-500/10">
                  <span>Connect to sync activities. Real Strava connection requires backend environment variables.</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Button
                    size="sm"
                    onClick={handleConnectStrava}
                    className="bg-orange-500 text-white hover:bg-orange-600 shadow-md flex-1 flex items-center justify-center gap-1.5 font-bold"
                  >
                    <Link2 size={15} />
                    Connect Strava
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleConnectMockStrava}
                    disabled={mockConnecting}
                    className="bg-slate-700 hover:bg-slate-800 text-white shadow-md flex-1 flex items-center justify-center gap-1.5 font-bold"
                  >
                    {mockConnecting ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
                    Connect Mock Strava
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Config Missing Banner/Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-2xl p-6 shadow-2xl animate-in scale-in duration-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-warning/10 rounded-full text-warning flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Strava Client ID Missing
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  Strava Client ID is not configured on the backend server. Please add <code className="bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">STRAVA_CLIENT_ID</code> and <code className="bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">STRAVA_CLIENT_SECRET</code> to your backend <code className="bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">.env</code> file.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  For immediate evaluation and instant testing, please use the **Connect Mock Strava** option.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-150 dark:border-[#243244]">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg transition"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  handleConnectMockStrava();
                }}
                className="px-4 py-2 bg-accent text-white hover:bg-accent/90 text-xs font-bold rounded-lg transition"
              >
                Use Mock Strava
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-2xl p-6 shadow-2xl animate-in scale-in duration-300">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Clear All Data?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete all workouts, records, nutrition entries, and targets? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-danger text-white text-xs font-bold rounded-lg hover:bg-danger/90 transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-2xl p-6 shadow-2xl animate-in scale-in duration-300">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Disconnect Strava?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to disconnect your Strava integration? AthleteOS will stop syncing new activities, but your existing workouts will remain saved.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDisconnect(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnectStrava}
                className="px-4 py-2 bg-danger text-white text-xs font-bold rounded-lg hover:bg-danger/90 transition"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;