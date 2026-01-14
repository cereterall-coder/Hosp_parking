import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Setup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // 1. Asegurar que no hay sesión activa que interfiera
            await signOut(auth);

            // 2. Crear usuario en Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. Crear documento de rol en Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: role,
                createdAt: new Date()
            });

            setMessage(`✅ Usuario ${email} creado exitosamente con rol: ${role}. Puedes usarlo para iniciar sesión.`);

            // Limpiar campos
            setEmail('');
            setPassword('');

        } catch (error) {
            console.error(error);
            setMessage(`❌ Error: ${error.message}`);
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
            <h1>⚙️ Inicialización de Usuarios</h1>
            <p>Usa esta herramienta temporal para crear tus usuarios semilla.</p>

            <div className="card" style={{ marginTop: '1rem' }}>
                <form onSubmit={handleCreateUser}>
                    <div className="input-group">
                        <label className="label">Correo Electrónico</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="ej: admin@hospital.com"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="label">Contraseña</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="label">Rol Asignado</label>
                        <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                            <option value="admin">Administrador (Web)</option>
                            <option value="agent">Agente (Móvil)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Creando...' : 'Crear Usuario'}
                    </button>
                </form>

                {message && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        background: message.startsWith('✅') ? '#ECFDF5' : '#FEF2F2',
                        color: message.startsWith('✅') ? '#047857' : '#DC2626'
                    }}>
                        {message}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3>Pasos sugeridos:</h3>
                <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                    <li>Crea un usuario <b>Admin</b> (ej. admin@test.com).</li>
                    <li>Crea un usuario <b>Agente</b> (ej. agente@test.com).</li>
                    <li>Una vez creados, ve al <a href="/login">Login</a> e ingresa.</li>
                </ol>
            </div>
        </div>
    );
}
