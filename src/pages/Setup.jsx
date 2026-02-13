import React, { useState } from 'react';
import { supabase } from '../supabase';

export default function Setup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Generar el email interno
        const fakeEmail = `${username.toLowerCase().trim().replace(/\s+/g, '')}@hospital.local`;

        try {
            await supabase.auth.signOut();

            const { data: { user }, error: authError } = await supabase.auth.signUp({
                email: fakeEmail,
                password,
            });

            if (authError) throw authError;

            if (user) {
                const { error: dbError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        username: username,
                        email: fakeEmail,
                        role: role,
                        created_at: new Date().toISOString()
                    });

                if (dbError) throw dbError;
            }

            setMessage(`✅ Usuario "${username}" creado exitosamente.`);
            setUsername('');
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
            <p>Usa esta herramienta temporal para crear tus usuarios semilla. [ACTUALIZACIÓN VERIFICADA ✅]</p>

            <div className="card" style={{ marginTop: '1rem' }}>
                <form onSubmit={handleCreateUser} noValidate>
                    <div className="input-group">
                        <label className="label">Nombre de Usuario</label>
                        <input
                            type="text"
                            name="setup_username"
                            id="setup_username"
                            className="input"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="Nombre de usuario (sin @)"
                            autoComplete="off"
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
                        <label className="label">Rol</label>
                        <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                            <option value="admin">Administrador (Control Total)</option>
                            <option value="supervisor">Supervisor (Gestión)</option>
                            <option value="agent">Agente (Portería)</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Creando...' : 'Crear Usuario'}
                    </button>
                </form>

                {message && (
                    <div style={{
                        marginTop: '1rem', padding: '1rem', borderRadius: '0.5rem',
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
                    <li>Crea un usuario <b>Admin</b> (ej. admin1).</li>
                    <li>Crea un usuario <b>Agente</b> (ej. agente1).</li>
                    <li>Una vez creados, ve al <a href="/login">Login</a> e ingresa.</li>
                </ol>
            </div>
        </div>
    );
}
