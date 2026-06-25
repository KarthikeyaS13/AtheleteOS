import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Trophy, Check, X, ArrowRight, Activity, Bike, Droplet } from 'lucide-react';
import { acceptPendingPR, rejectPendingPR } from '../../store/slices/stravaSlice';

const StravaPRBanner = () => {
  const dispatch = useDispatch();
  const pendingPRs = useSelector(state => state.strava.pendingPRs);
  const [isOpen, setIsOpen] = useState(false);
  const [processing, setProcessing] = useState({});

  if (!pendingPRs || pendingPRs.length === 0) return null;

  const handleAccept = async (pr) => {
    setProcessing(prev => ({ ...prev, [`${pr.sport}-${pr.event}`]: 'accept' }));
    try {
      await dispatch(acceptPendingPR({ sport: pr.sport, event: pr.event })).unwrap();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(prev => {
        const copy = { ...prev };
        delete copy[`${pr.sport}-${pr.event}`];
        return copy;
      });
    }
  };

  const handleReject = async (pr) => {
    setProcessing(prev => ({ ...prev, [`${pr.sport}-${pr.event}`]: 'reject' }));
    try {
      await dispatch(rejectPendingPR({ sport: pr.sport, event: pr.event })).unwrap();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(prev => {
        const copy = { ...prev };
        delete copy[`${pr.sport}-${pr.event}`];
        return copy;
      });
    }
  };

  const getSportIcon = (sport) => {
    switch (sport) {
      case 'Running': return <Activity className="w-5 h-5 text-accent" />;
      case 'Cycling': return <Bike className="w-5 h-5 text-success" />;
      case 'Swimming': return <Droplet className="w-5 h-5 text-purple-500" />;
      default: return <Trophy className="w-5 h-5 text-warning" />;
    }
  };

  return (
    <>
      {/* Floating Banner */}
      <div className="fixed bottom-4 right-4 z-50 max-w-md w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-accent/20 dark:border-accent/30 rounded-xl p-4 shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-up duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-accent/10 rounded-lg flex items-center justify-center">
            <Trophy className="w-6 h-6 text-accent animate-bounce" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              New Personal Records!
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              We found {pendingPRs.length} new PR{pendingPRs.length > 1 ? 's' : ''} from your Strava workouts.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-1.5 bg-accent text-white text-xs font-bold rounded-lg hover:bg-accent/90 shadow transition-all duration-200 shrink-0"
        >
          Review PRs
        </button>
      </div>

      {/* Review Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-2xl p-6 shadow-2xl animate-in scale-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent" />
                  Review Personal Records
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  We found these workouts that beat your previous personal records. Choose which ones to update.
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Suggestions List */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 my-4">
              {pendingPRs.map((pr) => {
                const isAccepting = processing[`${pr.sport}-${pr.event}`] === 'accept';
                const isRejecting = processing[`${pr.sport}-${pr.event}`] === 'reject';
                
                return (
                  <div 
                    key={`${pr.sport}-${pr.event}`} 
                    className="p-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-[#243244] rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-lg">
                        {getSportIcon(pr.sport)}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-black tracking-wider">
                          {pr.sport} • {pr.event}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {pr.previousValue ? (
                            <>
                              <span className="text-xs text-gray-400 line-through">
                                {pr.previousValue}
                              </span>
                              <ArrowRight size={12} className="text-gray-400" />
                            </>
                          ) : null}
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {pr.value}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          Set on {pr.date}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(pr)}
                        disabled={isAccepting || isRejecting}
                        className="p-2 bg-success/10 hover:bg-success/20 text-success rounded-lg transition-colors duration-150 disabled:opacity-50"
                        title="Accept PR"
                      >
                        {isAccepting ? (
                          <div className="w-4 h-4 border-2 border-success/30 border-t-success rounded-full animate-spin" />
                        ) : (
                          <Check size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(pr)}
                        disabled={isAccepting || isRejecting}
                        className="p-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors duration-150 disabled:opacity-50"
                        title="Dismiss PR"
                      >
                        {isRejecting ? (
                          <div className="w-4 h-4 border-2 border-danger/30 border-t-danger rounded-full animate-spin" />
                        ) : (
                          <X size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-gray-150 dark:border-[#243244]">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-250 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StravaPRBanner;
