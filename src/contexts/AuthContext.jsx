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
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [sessionId] = useState(Math.random().toString(36).substring(2, 15));

    useEffect(() => {
        // --- CONTROL DE PESTAÑAS DUPLICADAS (Mismo Navegador) ---
        const channel = new BroadcastChannel('cochera_session_control');

        // Notificamos a otras pestañas que hemos abierto una nueva
        channel.postMessage({ type: 'NEW_INSTANCE_OPENED', id: sessionId });

        channel.onmessage = (event) => {
            if (event.data.type === 'NEW_INSTANCE_OPENED' && event.data.id !== sessionId) {
                // Otra pestaña se abrió. Podemos decidir quién se queda.
                // Opción A: Mandar un "sigo aquí" para que la nueva se cierre
                channel.postMessage({ type: 'INSTANCE_ALREADY_EXISTS', targetId: event.data.id });
            }
            if (event.data.type === 'INSTANCE_ALREADY_EXISTS' && event.data.targetId === sessionId) {
                // Esta pestaña es la duplicada
                setIsDuplicate(true);
            }
        };

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
                    await syncSession(session.user.id);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                clearTimeout(safetyTimeout);
                setLoading(false);
            }
        };

        getSession();

        let channelSubscription = null;

        // 3. Escuchar cambios en la autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                setCurrentUser(session.user);
                await fetchUserRole(session.user.id);
                if (event === 'SIGNED_IN') {
                    await syncSession(session.user.id);
                }
            } else {
                setCurrentUser(null);
                setUserRole(null);
                setIsDuplicate(false);
                localStorage.removeItem('user_role');
                if (channelSubscription) {
                    supabase.removeChannel(channelSubscription);
                    channelSubscription = null;
                }
            }
            clearTimeout(safetyTimeout);
            setLoading(false);
        });

        // 4. Función para sincronizar sesión con DB
        const syncSession = async (userId) => {
            if (!userId) return;

            // Intentamos actualizar el token de sesión en la DB
            // NOTA: Requiere columna 'current_session_id' en tabla 'users'
            try {
                await supabase
                    .from('users')
                    .update({ current_session_id: sessionId })
                    .eq('id', userId);

                // Nos suscribimos a cambios en nuestro usuario para detectar si alguien más entra
                if (channelSubscription) supabase.removeChannel(channelSubscription);

                channelSubscription = supabase
                    .channel(`user_session_${userId}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'users',
                        filter: `id=eq.${userId}`
                    }, (payload) => {
                        if (payload.new.current_session_id && payload.new.current_session_id !== sessionId) {
                            console.warn("Sesión duplicada detectada desde DB.");
                            setIsDuplicate(true);
                        }
                    })
                    .subscribe();

            } catch (e) {
                console.warn("No se pudo sincronizar sesión remota (posible falta de columna current_session_id):", e);
            }
        };

        return () => {
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
            channel.close();
            if (channelSubscription) supabase.removeChannel(channelSubscription);
        };
    }, [sessionId]);

    const fetchUserRole = async (userId) => {
        try {
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
        loading,
        isDuplicate,
        logout: () => supabase.auth.signOut(),
        reconnect: () => {
            if (currentUser) syncSession(currentUser.id);
            setIsDuplicate(false);
        }
    };

    if (isDuplicate) {
        return (
            <div style={{
                height: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: '#0F172A', color: 'white', textAlign: 'center', padding: '2rem'
            }}>
                <div style={{ background: '#EF4444', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 0 30px rgba(239, 68, 68, 0.5)' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 800 }}>Sesión Duplicada</h1>
                <p style={{ color: '#94A3B8', maxWidth: '450px', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                    Se ha detectado que tu cuenta está siendo utilizada en otro dispositivo o pestaña.
                    Por seguridad, esta ventana ha sido desactivada.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                    <button
                        onClick={() => {
                            setIsDuplicate(false);
                            if (currentUser) syncSession(currentUser.id);
                        }}
                        style={{
                            padding: '1rem',
                            background: '#2563EB', color: 'white', border: 'none',
                            borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700,
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)',
                            transition: 'transform 0.2s'
                        }}
                    >
                        RETOMAR AQUÍ (Cerrar otras)
                    </button>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        style={{
                            padding: '1rem',
                            background: 'transparent', color: '#EF4444', border: '2px solid #EF4444',
                            borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700
                        }}
                    >
                        CERRAR SESIÓN Y SALIR
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
