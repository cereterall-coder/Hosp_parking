import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 0. Cargar rol desde cache si existe (para redes lentas del hospital)
        const cachedRole = localStorage.getItem('user_role');
        if (cachedRole) setUserRole(cachedRole);

        // 1. Timeout de seguridad (Si en 15s no responde Supabase, quitamos el loading)
        const safetyTimeout = setTimeout(() => {
            if (loading) {
                console.warn("Auth: Safety timeout reached. Forcing loading to false.");
                setLoading(false);
            }
        }, 15000);

        // 2. Obtener sesión inicial
        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setCurrentUser(session.user);
                    await fetchUserRole(session.user.id);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                clearTimeout(safetyTimeout);
                setLoading(false);
            }
        };

        getSession();

        // 3. Escuchar cambios en la autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                setCurrentUser(session.user);
                await fetchUserRole(session.user.id);
            } else {
                setCurrentUser(null);
                setUserRole(null);
                localStorage.removeItem('user_role');
            }
            clearTimeout(safetyTimeout);
            setLoading(false);
        });

        return () => {
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserRole = async (userId) => {
        try {
            // Ponemos un timeout de 3s para obtener el rol, si no, asumimos nulo temporalmente
            const rolePromise = supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout rol")), 10000)
            );

            const { data, error } = await Promise.race([rolePromise, timeoutPromise]);

            if (data) {
                console.log("Rol obtenido:", data.role);
                setUserRole(data.role);
                localStorage.setItem('user_role', data.role);
            }
        } catch (error) {
            console.warn("No se pudo obtener el rol a tiempo, reintentando en segundo plano...");
        }
    };

    const value = {
        currentUser,
        userRole,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
