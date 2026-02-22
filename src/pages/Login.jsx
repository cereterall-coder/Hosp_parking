import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Car, Lock, Mail, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Auto-append domain if simple username is used
        let loginEmail = username;
        if (!username.includes('@')) {
            loginEmail = `${username}@hospital.local`;
        }

        try {
            console.log("Iniciando sesión para:", loginEmail);

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: password,
            });

            if (authError) throw authError;

            if (authData?.user) {
                // Validamos si la cuenta está deshabilitada (opcional, pero no bloqueante)
                try {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('is_disabled')
                        .eq('id', authData.user.id)
                        .single();

                    if (userData?.is_disabled) {
                        await supabase.auth.signOut();
                        setError('CUENTA INHABILITADA');
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.warn("Validación de cuenta deshabilitada falló, continuando...");
                }

                console.log("Acceso concedido, redirigiendo...");
                // Pequeña pausa para asegurar que el estado de AuthContext se sincronice
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 500);
            }
        } catch (err) {
            console.error("Error en login:", err);
            setError(err.message === 'Invalid login credentials' ? 'Usuario o contraseña incorrectos' : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div className="card fade-in" style={{
                width: '100%',
                maxWidth: '360px',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                        width: '48px', height: '48px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
                    }}>
                        <Car size={24} color="white" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <h1 style={{ fontSize: '1.25rem', color: '#0F172A', fontWeight: 700, lineHeight: 1.2, margin: 0 }}>Hospital Parking</h1>
                        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>Acceso Seguro</p>
                    </div>
                </div>

                {error && (
                    <div className="badge badge-danger" style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        marginBottom: '1.5rem', padding: '0.75rem', justifyContent: 'center', width: '100%'
                    }}>
                        <ShieldCheck size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} noValidate>
                    <div className="input-group">
                        <label className="label">Usuario</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                name="login_user_field"
                                id="login_user_field"
                                className="input"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="Escribe tu Usuario aquí"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="off"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="label">Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="input"
                                style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#94A3B8',
                                    padding: 0,
                                    display: 'flex'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }} disabled={loading}>
                        {loading ? 'Verificando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>&copy; 2026 Ing. Amaro Vilela Vargas - 944499069</p>
                    <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>E-mail: amalviva@gmail.com</p>
                </div>
            </div>
        </div>
    );
}
