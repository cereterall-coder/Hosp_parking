import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Car, Lock, Mail, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
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
        let loginEmail = email;
        if (!email.includes('@')) {
            loginEmail = `${email}@hospital.local`;
        }

        try {
            await signInWithEmailAndPassword(auth, loginEmail, password);

            // Check for shift status if it's an agent
            // Note: We need to get the user doc here to check 'onShift' before redirecting
            // But AuthContext handles role fetching. Let's do a quick manual check or rely on AuthContext redirecting if blocked?
            // Better: let AuthProvider handle it? No, login page should show error.
            // We need to fetch the user's role and logic here.

            // Since we don't want to re-fetch too much, let's rely on the dashboard to block or Login to block.
            // Let's implement a quick check here.

            const user = auth.currentUser;
            if (user) {
                const { getDoc, doc } = await import("firebase/firestore"); // Dynamic import to save headers? No, just import normally if needed, but we have references.
                // We can't easily import db here without making it messy? We have db imported.
                const { db } = await import("../firebase");
                const d = await getDoc(doc(db, "users", user.uid));
                if (d.exists()) {
                    const userData = d.data();
                    if (userData.role === 'agent' && !userData.onShift) {
                        await auth.signOut();
                        setError('ACCESO DENEGADO: Tu turno no está habilitado por un Supervisor.');
                        setLoading(false);
                        return;
                    }
                }
            }

            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Credenciales incorrectas. Intente nuevamente.');
        }
        setLoading(false);
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
                maxWidth: '420px',
                padding: '2.5rem',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                        width: '64px', height: '64px',
                        borderRadius: '16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                        boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
                    }}>
                        <Car size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: '#0F172A' }}>Hospital Parking</h1>
                    <p style={{ color: '#64748B' }}>Sistema de Control de Acceso Seguro</p>
                </div>

                {error && (
                    <div className="badge badge-danger" style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        marginBottom: '1.5rem', padding: '0.75rem', justifyContent: 'center', width: '100%'
                    }}>
                        <ShieldCheck size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label className="label">Usuario o Correo</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                className="input"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="Ej: agente1 o admin@hospital.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                    <p className="text-muted text-sm">¿Problemas de acceso? Contacte a Sistemas.</p>
                </div>
            </div>
        </div>
    );
}
