'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import NewPrescripteurPage from '@/components/pages/NewPrescripteurPage';
import { clientsApi } from '@/lib/api/clients';
import type { ClientWithRelations } from '@/lib/api/clients';

interface PrescripteurEditPageProps {
  params: { id: string };
  searchParams: { mode?: 'edit' | 'view' };
}

export default function PrescripteurEditPage({ params, searchParams }: PrescripteurEditPageProps) {
  const router = useRouter();
  const [client, setClient] = useState<ClientWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clientId = parseInt(params.id);
  const mode = searchParams.mode || 'edit';

  // Validate client ID
  if (isNaN(clientId)) {
    notFound();
  }

  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        const result = await clientsApi.getClientWithRelations(clientId);
        
        if (result.success && result.data) {
          setClient(result.data);
        } else {
          setError('Client non trouvé');
        }
      } catch (err) {
        console.error('Error loading client:', err);
        setError('Erreur lors du chargement du client');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du client...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-6">{error || 'Client non trouvé'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <NewPrescripteurPage 
      initialData={client}
      mode={mode}
    />
  );
}