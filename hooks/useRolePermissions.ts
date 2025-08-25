import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Types
export interface AppModule {
  id: number;
  nom: string;
  libelle: string;
  description: string;
  icone: string;
  ordre: number;
  actif: boolean;
}

export interface AppAction {
  id: number;
  nom: string;
  libelle: string;
  description: string;
}

export interface UserRole {
  id: string;
  nom: string;
  description: string;
  icone: string;
  couleur: string;
  ordre: number;
  actif: boolean;
  systeme: boolean;
}

export interface RolePermission {
  id: number;
  role_id: string;
  module_id: number;
  action_id: number;
  accordee: boolean;
  module?: AppModule;
  action?: AppAction;
}

export interface Permission {
  module: string;
  actions: string[];
}

interface UseRolePermissionsReturn {
  // Données
  modules: AppModule[];
  actions: AppAction[];
  roles: UserRole[];
  permissions: RolePermission[];
  
  // États
  loading: boolean;
  error: string | null;
  
  // Fonctions de manipulation des rôles
  createRole: (role: Omit<UserRole, 'systeme'>) => Promise<boolean>;
  updateRole: (roleId: string, updates: Partial<UserRole>) => Promise<boolean>;
  deleteRole: (roleId: string) => Promise<boolean>;
  duplicateRole: (roleId: string, newRoleId: string, newName: string) => Promise<boolean>;
  toggleRoleStatus: (roleId: string) => Promise<boolean>;
  
  // Fonctions de manipulation des permissions
  updatePermission: (roleId: string, moduleId: number, actionId: number, granted: boolean) => Promise<boolean>;
  hasPermission: (roleId: string, moduleId: number, actionId: number) => boolean;
  getRolePermissions: (roleId: string) => Permission[];
  
  // Fonctions utilitaires
  getUserPermissions: (userId: string) => Promise<Permission[]>;
  syncUserPermissions: (userId: string) => Promise<boolean>;
  checkUserPermission: (userId: string, module: string, action: string) => Promise<boolean>;
  
  // Rechargement
  reload: () => Promise<void>;
}

export const useRolePermissions = (): UseRolePermissionsReturn => {
  // États
  const [modules, setModules] = useState<AppModule[]>([]);
  const [actions, setActions] = useState<AppAction[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger toutes les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger en parallèle toutes les données
      const [modulesResult, actionsResult, rolesResult, permissionsResult] = await Promise.all([
        supabase.from('app_modules').select('*').order('ordre'),
        supabase.from('app_actions').select('*').order('nom'),
        supabase.from('user_roles').select('*').order('ordre'),
        supabase.from('role_permissions').select(`
          *,
          module:app_modules(*),
          action:app_actions(*)
        `)
      ]);

      if (modulesResult.error) throw modulesResult.error;
      if (actionsResult.error) throw actionsResult.error;
      if (rolesResult.error) throw rolesResult.error;
      if (permissionsResult.error) throw permissionsResult.error;

      setModules(modulesResult.data || []);
      setActions(actionsResult.data || []);
      setRoles(rolesResult.data || []);
      setPermissions(permissionsResult.data || []);

    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données de permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Abonnement aux changements en temps réel
  useEffect(() => {
    const subscriptions = [
      // Écouter les changements sur les rôles
      supabase
        .channel('roles_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
          loadData();
        })
        .subscribe(),

      // Écouter les changements sur les permissions
      supabase
        .channel('permissions_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'role_permissions' }, () => {
          loadData();
        })
        .subscribe()
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [loadData]);

  // Fonctions de manipulation des rôles
  const createRole = async (role: Omit<UserRole, 'systeme'>): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          ...role,
          systeme: false
        });

      if (error) throw error;
      
      await loadData();
      return true;
    } catch (err) {
      console.error('Erreur lors de la création du rôle:', err);
      setError('Erreur lors de la création du rôle');
      return false;
    }
  };

  const updateRole = async (roleId: string, updates: Partial<UserRole>): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('user_roles')
        .update(updates)
        .eq('id', roleId);

      if (error) throw error;
      
      await loadData();
      return true;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du rôle:', err);
      setError('Erreur lors de la mise à jour du rôle');
      return false;
    }
  };

  const deleteRole = async (roleId: string): Promise<boolean> => {
    try {
      setError(null);
      
      // Vérifier s'il y a des utilisateurs avec ce rôle
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('role', roleId)
        .limit(1);

      if (users && users.length > 0) {
        setError('Impossible de supprimer ce rôle car il est utilisé par des utilisateurs');
        return false;
      }

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      
      await loadData();
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression du rôle:', err);
      setError('Erreur lors de la suppression du rôle');
      return false;
    }
  };

  const duplicateRole = async (roleId: string, newRoleId: string, newName: string): Promise<boolean> => {
    try {
      setError(null);
      
      // Récupérer le rôle source
      const sourceRole = roles.find(r => r.id === roleId);
      if (!sourceRole) {
        setError('Rôle source introuvable');
        return false;
      }

      // Créer le nouveau rôle
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          id: newRoleId,
          nom: newName,
          description: `${sourceRole.description} (Copie)`,
          icone: sourceRole.icone,
          couleur: sourceRole.couleur,
          ordre: Math.max(...roles.map(r => r.ordre)) + 1,
          actif: true,
          systeme: false
        });

      if (roleError) throw roleError;

      // Copier les permissions
      const sourcePermissions = permissions.filter(p => p.role_id === roleId && p.accordee);
      
      if (sourcePermissions.length > 0) {
        const newPermissions = sourcePermissions.map(p => ({
          role_id: newRoleId,
          module_id: p.module_id,
          action_id: p.action_id,
          accordee: true
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(newPermissions);

        if (permError) throw permError;
      }
      
      await loadData();
      return true;
    } catch (err) {
      console.error('Erreur lors de la duplication du rôle:', err);
      setError('Erreur lors de la duplication du rôle');
      return false;
    }
  };

  const toggleRoleStatus = async (roleId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const role = roles.find(r => r.id === roleId);
      if (!role) {
        setError('Rôle introuvable');
        return false;
      }

      const { error } = await supabase
        .from('user_roles')
        .update({ actif: !role.actif })
        .eq('id', roleId);

      if (error) throw error;
      
      await loadData();
      return true;
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
      setError('Erreur lors du changement de statut');
      return false;
    }
  };

  // Fonctions de manipulation des permissions
  const updatePermission = async (roleId: string, moduleId: number, actionId: number, granted: boolean): Promise<boolean> => {
    try {
      setError(null);
      
      const existingPermission = permissions.find(p => 
        p.role_id === roleId && p.module_id === moduleId && p.action_id === actionId
      );

      if (existingPermission) {
        // Mettre à jour la permission existante
        const { error } = await supabase
          .from('role_permissions')
          .update({ accordee: granted })
          .eq('id', existingPermission.id);

        if (error) throw error;
      } else {
        // Créer une nouvelle permission
        const { error } = await supabase
          .from('role_permissions')
          .insert({
            role_id: roleId,
            module_id: moduleId,
            action_id: actionId,
            accordee: granted
          });

        if (error) throw error;
      }
      
      await loadData();
      return true;
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la permission:', err);
      setError('Erreur lors de la mise à jour de la permission');
      return false;
    }
  };

  const hasPermission = (roleId: string, moduleId: number, actionId: number): boolean => {
    return permissions.some(p => 
      p.role_id === roleId && 
      p.module_id === moduleId && 
      p.action_id === actionId && 
      p.accordee
    );
  };

  const getRolePermissions = (roleId: string): Permission[] => {
    const rolePerms = permissions.filter(p => p.role_id === roleId && p.accordee);
    
    // Grouper par module
    const grouped = rolePerms.reduce((acc, perm) => {
      if (!perm.module || !perm.action) return acc;
      
      const moduleName = perm.module.nom;
      if (!acc[moduleName]) {
        acc[moduleName] = [];
      }
      acc[moduleName].push(perm.action.nom);
      return acc;
    }, {} as Record<string, string[]>);

    return Object.entries(grouped).map(([module, actions]) => ({
      module,
      actions: actions.sort()
    }));
  };

  // Fonctions utilitaires pour les utilisateurs
  const getUserPermissions = async (userId: string): Promise<Permission[]> => {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('role, permissions')
        .eq('id', userId)
        .single();

      if (!user) return [];

      // Si les permissions sont déjà en cache, les retourner
      if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
        return user.permissions;
      }

      // Sinon, les calculer et les synchroniser
      const rolePerms = getRolePermissions(user.role);
      await syncUserPermissions(userId);
      return rolePerms;
    } catch (err) {
      console.error('Erreur lors de la récupération des permissions utilisateur:', err);
      return [];
    }
  };

  const syncUserPermissions = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('sync_user_permissions', { user_id: userId });
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erreur lors de la synchronisation des permissions:', err);
      return false;
    }
  };

  const checkUserPermission = async (userId: string, module: string, action: string): Promise<boolean> => {
    try {
      const userPermissions = await getUserPermissions(userId);
      const modulePermissions = userPermissions.find(p => p.module === module);
      
      return modulePermissions ? modulePermissions.actions.includes(action) : false;
    } catch (err) {
      console.error('Erreur lors de la vérification de permission:', err);
      return false;
    }
  };

  return {
    // Données
    modules,
    actions,
    roles,
    permissions,
    
    // États
    loading,
    error,
    
    // Fonctions de manipulation des rôles
    createRole,
    updateRole,
    deleteRole,
    duplicateRole,
    toggleRoleStatus,
    
    // Fonctions de manipulation des permissions
    updatePermission,
    hasPermission,
    getRolePermissions,
    
    // Fonctions utilitaires
    getUserPermissions,
    syncUserPermissions,
    checkUserPermission,
    
    // Rechargement
    reload: loadData
  };
}; 