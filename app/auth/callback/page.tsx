'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const [message, setMessage] = useState('Traitement de la connexion...');
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setMessage('Erreur lors de la connexion');
          console.error('Auth callback error:', error);
          setTimeout(() => router.push('/supabase-auth'), 3000);
          return;
        }

        if (data.session) {
          setMessage('Connexion réussie ! Redirection...');
          setTimeout(() => router.push('/supabase-auth'), 2000);
        } else {
          setMessage('Aucune session trouvée');
          setTimeout(() => router.push('/supabase-auth'), 3000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setMessage('Erreur inattendue');
        setTimeout(() => router.push('/supabase-auth'), 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold mb-2">Authentification</h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
} 