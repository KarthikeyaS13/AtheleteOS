import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { connectStrava } from '../store/slices/stravaSlice';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMsg(error === 'access_denied' ? 'Access denied by user.' : 'An error occurred during Strava authorization.');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMsg('No authorization code found in the callback URL.');
      return;
    }

    const doConnect = async () => {
      try {
        await dispatch(connectStrava(code)).unwrap();
        setStatus('success');
        
        // Auto redirect after 3 seconds
        const timer = setTimeout(() => {
          navigate('/settings');
        }, 3000);
        return () => clearTimeout(timer);
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.message || 'Failed to exchange Strava token.');
      }
    };

    doConnect();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-300">
        {status === 'connecting' && (
          <div className="space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-20 h-20 rounded-full border-4 border-orange-500/10 dark:border-orange-500/5 animate-pulse" />
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connecting Strava</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Exchanging secure authorization credentials with Strava...
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-success animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connection Successful!</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Your Strava account is now linked. We have synced your recent workouts.
              </p>
              <p className="text-xs text-accent mt-4">Redirecting you back to settings...</p>
            </div>
            <div className="pt-2">
              <Button size="sm" onClick={() => navigate('/settings')} className="bg-success text-white hover:bg-success/90 shadow-md px-6">
                Go to Settings
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <XCircle className="w-16 h-16 text-danger" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connection Failed</h2>
              <p className="text-danger font-medium text-sm">
                {errorMsg}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                Please try connecting again from settings.
              </p>
            </div>
            <div className="pt-2">
              <Button size="sm" onClick={() => navigate('/settings')} className="bg-accent text-white hover:bg-accent/90 shadow-md px-6">
                Return to Settings
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StravaCallback;
