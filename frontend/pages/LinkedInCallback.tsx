import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { exchangeLinkedInCode } from '../services/social';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const LinkedInCallback: React.FC = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const code = params.get('code');
    if (!code) {
        setStatus('error');
        return;
    }

    const doExchange = async () => {
        try {
            // Reconstruct the redirect URI to match exactly what was sent in SocialStep
            const appBase = import.meta.env.VITE_APP_BASE_URL ?? window.location.origin;
            const redirectUri = `${appBase}/#/auth/linkedin/callback`;
            await exchangeLinkedInCode(code, redirectUri);
            setStatus('success');
            setTimeout(() => {
                window.opener?.postMessage({ type: 'LINKEDIN_CONNECTED' }, '*');
                window.close();
            }, 1500);
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    doExchange();
  }, [params]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm w-full">
            {status === 'loading' && (
                <>
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Connecting...</h2>
                    <p className="text-gray-500">Please wait while we link your account.</p>
                </>
            )}
            {status === 'success' && (
                <>
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Connected!</h2>
                    <p className="text-gray-500">You can close this window now.</p>
                </>
            )}
            {status === 'error' && (
                <>
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Connection Failed</h2>
                    <p className="text-gray-500">Something went wrong. Please try again.</p>
                </>
            )}
        </div>
    </div>
  );
};

export default LinkedInCallback;
