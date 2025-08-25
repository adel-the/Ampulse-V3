'use client';

import React, { useState, useEffect } from 'react';
import { useRolePermissions } from '../../hooks/useRolePermissions';
import { supabase } from '../../lib/supabase';

interface PermissionGuardProps {
  children: React.ReactNode;
  module: string;
  action: string;
  userId?: string;
  fallback?: React.ReactNode;
  showError?: boolean;
}

interface PermissionCheckProps {
  module: string;
  action: string;
  userId?: string;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  module,
  action,
  userId,
  fallback = null,
  showError = false
}) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { checkUserPermission } = useRolePermissions();

  useEffect(() => {
    checkPermission();
  }, [module, action, userId]);

  const checkPermission = async () => {
    try {
      setLoading(true);
      setError(null);

      // Si aucun userId n'est fourni, essayer de récupérer l'utilisateur actuel
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasPermission(false);
          setLoading(false);
          return;
        }
        currentUserId = user.id;
      }

      const permitted = await checkUserPermission(currentUserId, module, action);
      setHasPermission(permitted);

    } catch (err) {
      console.error('Erreur lors de la vérification des permissions:', err);
      setError('Erreur lors de la vérification des permissions');
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && showError) {
    return (
      <div className="text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded">
        {error}
      </div>
    );
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Hook personnalisé pour vérifier les permissions de manière simple
export const usePermissionCheck = ({ module, action, userId }: PermissionCheckProps) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { checkUserPermission } = useRolePermissions();

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);

        let currentUserId = userId;
        if (!currentUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setHasPermission(false);
            setLoading(false);
            return;
          }
          currentUserId = user.id;
        }

        const permitted = await checkUserPermission(currentUserId, module, action);
        setHasPermission(permitted);

      } catch (err) {
        console.error('Erreur lors de la vérification des permissions:', err);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [module, action, userId, checkUserPermission]);

  return { hasPermission, loading };
};

// Composant pour afficher un message d'accès refusé
export const AccessDenied: React.FC<{ message?: string }> = ({ 
  message = "Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité." 
}) => (
  <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
    <div className="mb-4">
      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Accès refusé</h3>
    <p className="text-gray-600">{message}</p>
  </div>
);

// Composant de bouton conditionnel basé sur les permissions
interface PermissionButtonProps {
  module: string;
  action: string;
  userId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  module,
  action,
  userId,
  children,
  fallback = null,
  className = '',
  onClick,
  disabled = false
}) => {
  const { hasPermission, loading } = usePermissionCheck({ module, action, userId });

  if (loading) {
    return (
      <button className={`${className} opacity-50 cursor-not-allowed`} disabled>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      </button>
    );
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return (
    <button 
      className={className} 
      onClick={onClick} 
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Composant pour les liens conditionnels
interface PermissionLinkProps {
  module: string;
  action: string;
  userId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  href?: string;
  className?: string;
  onClick?: () => void;
}

export const PermissionLink: React.FC<PermissionLinkProps> = ({
  module,
  action,
  userId,
  children,
  fallback = null,
  href,
  className = '',
  onClick
}) => {
  const { hasPermission, loading } = usePermissionCheck({ module, action, userId });

  if (loading) {
    return (
      <span className={`${className} opacity-50`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      </span>
    );
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  if (href) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <span className={className} onClick={onClick}>
      {children}
    </span>
  );
};

export default PermissionGuard; 
