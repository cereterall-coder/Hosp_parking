import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import Tesseract from 'tesseract.js';

export default function PorterDashboard() {
    const { logout } = useAuth();
    const [view, setView] = useState('menu'); // 'menu', 'operation'
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    if (data.role === 'agent' && !data.on_shift) {
                        alert("No tienes un turno activo. Contacta a un supervisor.");
                        window.location.href = '/login';
                    }
                    setCurrentUser(data);
                }
            }
            setLoading(false);
        };

        fetchUserData();

        const channel = supabase
            .channel('user_shift_status')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
                if (currentUser && payload.new.id === currentUser.id) {
                    setCurrentUser(prev => ({ ...prev, ...payload.new }));
                    if (!payload.new.on_shift) window.location.href = '/login';
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [currentUser?.id]);

    const handleLogout = async () => {
        await logout();
    };

    if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            {view === 'menu' ? (
                <AgentDashboardView
                    currentUser={currentUser}
                    onStart={() => setView('operation')}
                    onLogout={handleLogout}
                    onSwitchToStatus={() => setView('status')}
                />
            ) : view === 'status' ? (
                <AgentStatusView currentUser={currentUser} onBack={() => setView('menu')} />
            ) : (
                <UnifiedOperationFlow currentUser={currentUser} onBack={() => setView('menu')} />
            )}
        </div>
    );
}

function AgentDashboardView({ currentUser, onStart, onLogout, onSwitchToStatus }) {
    return (
        <div className="fade-in" style={{ padding: '1rem', maxWidth: '500px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <div style={{ background: '#2563EB', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)' }}>
                    <Car size={32} color="white" />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>Hospital Parking</h1>
                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Sistema de Control de Accesos</p>
            </header>

            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #2563EB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                        {currentUser?.full_name?.[0] || currentUser?.username?.[0] || 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>{currentUser?.full_name || currentUser?.username}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Agente de Seguridad • {currentUser?.hospital_name || 'Hospital Principal'}</div>
                    </div>
                    <div className="badge badge-success">EN TURNO</div>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                <button
                    onClick={onStart}
                    className="btn btn-primary"
                    style={{ padding: '1.25rem', fontSize: '1.1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
                >
                    <Camera size={24} /> Iniciar Operación
                </button>

                <button
                    onClick={onSwitchToStatus}
                    className="btn btn-outline"
                    style={{ padding: '1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                >
                    <LayoutDashboard size={20} /> Ver Ocupación
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Sede Activa</div>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>{currentUser?.hospital || '-'}</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Puerta</div>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>{currentUser?.gate || 'Principal'}</div>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="btn btn-outline"
                    style={{ marginTop: '2rem', color: '#EF4444', borderColor: '#FECACA' }}
                >
                    <LogOut size={18} /> Cerrar Sesión
                </button>
            </div>
        </div>
    );
}

function AgentStatusView({ currentUser, onBack }) {
    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        if (!currentUser?.hospital) return;

        const fetchVehicles = async () => {
            const { data } = await supabase
                .from('active_parking')
                .select('*')
                .eq('hospital', currentUser.hospital)
                .eq('status', 'occupied');
            if (data) setVehicles(data);
        };

        fetchVehicles();

        const channel = supabase
            .channel('active_parking_agent')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'active_parking' }, () => {
                fetchVehicles();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [currentUser]);

    return (
        <div className="fade-in" style={{ padding: '1rem', maxWidth: '500px', margin: '0 auto' }}>
            <button onClick={onBack} style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <ArrowLeft size={18} /> Volver Menu
            </button>

            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Vehículos en Sede</h3>
                <div className="badge badge-primary" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>{vehicles.length}</div>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
                {vehicles.map(v => {
                    const entryTime = v.entry_time ? new Date(v.entry_time) : null;
                    const diffMins = entryTime ? Math.round((new Date() - entryTime) / 60000) : 0;

                    return (
                        <div key={v.id} className="card" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'monospace', color: '#1E293B' }}>{v.plate}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{v.driver_name || 'Conductor General'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="badge badge-warning" style={{ marginBottom: '0.25rem', display: 'inline-block' }}>
                                    {diffMins} min
                                </div>
                                <div style={{ underline: 'none', fontSize: '0.75rem', color: '#94A3B8' }}>
                                    {entryTime ? entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {vehicles.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', border: '2px dashed #E2E8F0', borderRadius: '1rem' }}>
                        <Car size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>No hay vehículos registrados en {currentUser?.hospital}.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function UnifiedOperationFlow({ currentUser, onBack }) {
    const [step, setStep] = useState('scan');
    const [plate, setPlate] = useState('');
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [parkingItem, setParkingItem] = useState(null);

    const handleOCR = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setOcrLoading(true);
        setPlate('ANALIZANDO...');

        try {
            const { data: { text } } = await Tesseract.recognize(file, 'eng');
            const matchStandard = text.match(/([a-zA-Z]{3})[\s-]*([0-9]{3})(?![0-9])/);
            const matchOld = text.match(/([a-zA-Z]{2})[\s-]*([0-9]{4})/);

            let detected = null;
            if (matchStandard) detected = (matchStandard[1] + matchStandard[2]).toUpperCase();
            else if (matchOld) detected = (matchOld[1] + matchOld[2]).toUpperCase();
            else {
                const cleanAll = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                if (cleanAll.length >= 6 && cleanAll.length <= 7) detected = cleanAll;
            }

            if (detected) checkPlateAction(detected);
            else {
                alert("No se detectó patrón de placa (Ej: ABC-123). Intente de nuevo.");
                setPlate('');
            }
        } catch (err) {
            console.error(err);
            setPlate('');
        }
        setOcrLoading(false);
    };

    const checkPlateAction = async (plateToCheck) => {
        const p = plateToCheck || plate;
        if (!p) return;
        setPlate(p.toUpperCase());
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('active_parking')
                .select('*')
                .eq('plate', p.toUpperCase())
                .maybeSingle();

            if (data) {
                setParkingItem(data);
                setStep('exit');
            } else {
                setStep('entry');
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const resetFlow = () => {
        setStep('scan');
        setPlate('');
        setParkingItem(null);
        setMessage(null);
    };

    if (step === 'scan') {
        return (
            <div className="card fade-in" style={{ padding: '1.5rem', maxWidth: '500px', margin: '1rem auto' }}>
                <button onClick={onBack} style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <ArrowLeft size={18} /> Menu
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Escanear Placa</h3>
                    <p className="text-muted">Ingresa manualmente o usa la cámara.</p>
                </div>

                <div className="input-group">
                    <input
                        className="input"
                        value={plate}
                        onChange={e => setPlate(e.target.value.toUpperCase())}
                        placeholder="ABC-123"
                        style={{ fontSize: '2rem', textAlign: 'center', height: '80px', fontWeight: 900, letterSpacing: '2px' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '1rem', marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => checkPlateAction()} disabled={loading || !plate}>
                        {loading ? 'Buscando...' : 'CONTINUAR'}
                    </button>
                    <div style={{ position: 'relative' }}>
                        <input type="file" accept="image/*" capture="environment" onChange={handleOCR} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%' }} />
                        <button className="btn btn-outline btn-icon" style={{ width: '100%', height: '100%' }}>
                            {ocrLoading ? '...' : <Camera size={24} />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem', maxWidth: '500px', margin: '0 auto' }}>
            <button onClick={resetFlow} style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <ArrowLeft size={18} /> Volver Escáner
            </button>

            {step === 'entry' && <EntryForm plateProp={plate} onSuccess={resetFlow} currentUser={currentUser} />}
            {step === 'exit' && <ExitView parkingItem={parkingItem} onSuccess={resetFlow} onSwitchToEntry={() => setStep('entry')} />}
        </div>
    );
}

function EntryForm({ plateProp, onSuccess, currentUser }) {
    const [mode, setMode] = useState('personal');
    const [plate] = useState(plateProp);
    const [loading, setLoading] = useState(false);
    const [successView, setSuccessView] = useState(false);
    const [foundPerson, setFoundPerson] = useState(null);
    const [driverName, setDriverName] = useState('');
    const [vehicleType, setVehicleType] = useState('auto');

    useEffect(() => {
        const searchPersonal = async () => {
            if (mode === 'personal' && plate) {
                const { data } = await supabase
                    .from('personnel')
                    .select('*')
                    .eq('license_plate', plate.toUpperCase())
                    .maybeSingle();
                if (data) setFoundPerson(data);
            }
        };
        searchPersonal();
    }, [mode, plate]);

    const registerEntry = async () => {
        setLoading(true);
        try {
            const entryData = {
                plate: plate.toUpperCase(),
                type: mode,
                entry_time: new Date().toISOString(),
                status: 'occupied',
                hospital: currentUser?.hospital_name || 'Principal',
                gate: currentUser?.gate_name || 'Principal',
                agent_name: currentUser?.full_name || currentUser?.username || 'Agente',
                driver_name: mode === 'personal' ? (foundPerson?.full_name || 'Personal') : driverName,
                vehicle_type: mode === 'personal' ? (foundPerson?.vehicle_type || 'auto') : vehicleType
            };

            const { error } = await supabase.from('active_parking').insert(entryData);
            if (error) throw error;

            setSuccessView(true);
            setTimeout(onSuccess, 2000);
        } catch (err) { alert('Error al registrar'); }
        setLoading(false);
    };

    if (successView) return (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CheckCircle size={64} color="#16A34A" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#166534' }}>INGRESO EXITOSO</h2>
            <p>{plate}</p>
        </div>
    );

    return (
        <div className="card fade-in">
            <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>{plate}</h2>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button onClick={() => setMode('personal')} className={`btn ${mode === 'personal' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>Personal</button>
                <button onClick={() => setMode('libre')} className={`btn ${mode === 'libre' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>Libre</button>
            </div>

            {mode === 'personal' ? (
                <div style={{ marginBottom: '1.5rem' }}>
                    {foundPerson ? (
                        <div style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #10B981' }}>
                            <strong>{foundPerson.full_name}</strong>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>{foundPerson.role}</p>
                        </div>
                    ) : (
                        <p className="text-muted">No se encontró personal con esta placa.</p>
                    )}
                </div>
            ) : (
                <div className="input-group">
                    <label className="label">Conductor</label>
                    <input className="input" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Nombre..." />
                </div>
            )}

            <button className="btn btn-primary" onClick={registerEntry} disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Registrando...' : 'CONFIRMAR INGRESO'}
            </button>
        </div>
    );
}

function ExitView({ parkingItem, onSuccess, onSwitchToEntry }) {
    const [loading, setLoading] = useState(false);
    const [successView, setSuccessView] = useState(false);

    const processExit = async () => {
        setLoading(true);
        try {
            const { error: histError } = await supabase.from('history').insert({
                ...parkingItem,
                exit_time: new Date().toISOString(),
                status: 'completed'
            });
            if (histError) throw histError;

            const { error: delError } = await supabase.from('active_parking').delete().eq('id', parkingItem.id);
            if (delError) throw delError;

            setSuccessView(true);
            setTimeout(onSuccess, 2000);
        } catch (err) { alert('Error al procesar salida'); }
        setLoading(false);
    };

    if (successView) return (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CheckCircle size={64} color="#2563EB" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#1E40AF' }}>SALIDA REGISTRADA</h2>
            <p>{parkingItem.plate}</p>
        </div>
    );

    return (
        <div className="card fade-in">
            <h2 style={{ textAlign: 'center', color: '#EF4444' }}>COINCIDENCIA ENCONTRADA</h2>
            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#FEF2F2', borderRadius: '1rem', margin: '1rem 0' }}>
                <h1 style={{ fontSize: '3rem', margin: 0 }}>{parkingItem.plate}</h1>
                <p><strong>{parkingItem.driver_name}</strong></p>
                <p className="text-muted">Ingreso: {new Date(parkingItem.entry_time).toLocaleTimeString()}</p>
            </div>
            <button className="btn btn-danger" onClick={processExit} disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Saliendo...' : 'REGISTRAR SALIDA'}
            </button>
        </div>
    );
}
