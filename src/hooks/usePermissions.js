import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function usePermissions(session) {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session?.user?.id) {
            setRoles([]);
            setLoading(false);
            return;
        }

        const fetchRoles = async () => {
            // On récupère le nom de chaque rôle possédé par ce joueur
            const { data, error } = await supabase
                .from('user_roles')
                .select(`
                    roles (
                        name
                    )
                `)
                .eq('user_id', session.user.id);

            if (error) {
                console.error('Erreur chargement rôles:', error);
            } else if (data) {
                // Extrait les noms des rôles de l'objet imbriqué Supabase
                const roleNames = data.map(item => item.roles.name);
                setRoles(roleNames);
            }
            setLoading(false);
        };

        fetchRoles();
    }, [session]);

    // Fonction pratique pour vérifier si l'utilisateur a un rôle précis
    const hasRole = (roleName) => roles.includes(roleName);
    
    // Raccourcis pour les vérifs récurrentes
    const isFounder = hasRole('Fondateurs');
    const isStaff = isFounder || hasRole('Staff') || hasRole('Chef Staff');
    const isCoach = isFounder || hasRole('Coach') || hasRole('Head Coach') || isStaff;

    return { roles, hasRole, isFounder, isStaff, isCoach, loading };
}
