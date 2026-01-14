import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, orderBy, limit, serverTimestamp, where, updateDoc, writeBatch } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { LogOut, Car, Bike, Users, LayoutDashboard, History, Plus, Trash2, Search, Clock, Shield, UserPlus, UserCheck, ToggleLeft, ToggleRight, Scale, UploadCloud, FileSpreadsheet, Menu, X } from 'lucide-react';
import { createSystemUser } from '../utils/adminAuth';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { userRole } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const closeMenu = () => { if (isMobile) setMobileMenuOpen(false); };

    return (
        <div className="layout-container" style={{ position: 'relative', flexDirection: isMobile ? 'column' : 'row', display: 'flex' }}>
            {/* Mobile Header */}
            {isMobile && (
                <div style={{
                    background: '#0F172A', color: 'white', padding: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'sticky', top: 0, zIndex: 40, height: '60px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: '#2563EB', padding: '0.4rem', borderRadius: '0.5rem' }}>
                            <Car size={20} color="white" />
                        </div>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Hospital Parking</h1>
                    </div>
                    <button onClick={toggleMenu} style={{ background: 'none', border: 'none', color: 'white' }}>
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            )}

            {/* Sidebar Navigation */}
            <aside style={{
                width: isMobile ? '100%' : '280px',
                background: '#0F172A',
                color: 'white',
                display: isMobile ? (mobileMenuOpen ? 'flex' : 'none') : 'flex',
                flexDirection: 'column', padding: '2rem 1.5rem',
                boxShadow: '4px 0 24px rgba(0,0,0,0.05)',
                zIndex: 50,
                position: isMobile ? 'fixed' : 'sticky',
                top: isMobile ? '60px' : 0,
                bottom: 0, left: 0,
                height: isMobile ? 'calc(100vh - 60px)' : '100vh',
                overflowY: 'auto'
            }}>
                {/* ... Sidebar Content ... */}
                {!isMobile && (
                    <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: '#2563EB', padding: '0.5rem', borderRadius: '0.5rem' }}>
                            <Car size={24} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.25rem', color: 'white', lineHeight: 1.2 }}>Panel Control</h1>
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Hospital Parking</span>
                        </div>
                    </div>
                )}

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <NavBtn icon={<LayoutDashboard size={20} />} label="Dashboard General" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); closeMenu(); }} />
                    <NavBtn icon={<Users size={20} />} label="Gestión Personal" active={activeTab === 'personal'} onClick={() => { setActiveTab('personal'); closeMenu(); }} />
                    <NavBtn icon={<History size={20} />} label="Historial Accesos" active={activeTab === 'history'} onClick={() => { setActiveTab('history'); closeMenu(); }} />

                    <div style={{ margin: '0.5rem 0', borderTop: '1px solid #1E293B' }}></div>
                    <NavBtn icon={<UserCheck size={20} />} label="Control de Turnos" active={activeTab === 'shifts'} onClick={() => { setActiveTab('shifts'); closeMenu(); }} />

                    {userRole === 'admin' && (
                        <>
                            <NavBtn icon={<Shield size={20} />} label="Usuarios Sistema" active={activeTab === 'system_users'} onClick={() => { setActiveTab('system_users'); closeMenu(); }} />
                        </>
                    )}
                </nav>

                <div style={{ borderTop: '1px solid #1E293B', paddingTop: '1.5rem', marginTop: 'auto', paddingBottom: isMobile ? '2rem' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontWeight: 'bold' }}>{userRole?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.9rem', fontWeight: '500', textTransform: 'capitalize' }}>{userRole}</p>
                            <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Sesión Activa</p>
                        </div>
                    </div>
                    <button onClick={() => signOut(auth)} className="btn btn-outline" style={{ width: '100%', borderColor: '#334155', background: 'transparent', color: '#CBD5E1' }}>
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content" style={{
                flex: 1,
                padding: isMobile ? '1rem' : '2rem',
                overflowY: 'auto'
            }}>
                <div className="fade-in">
                    <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', lineHeight: 1.2 }}>
                                {activeTab === 'dashboard' && 'Visión General'}
                                {activeTab === 'personal' && 'Personal Autorizado'}
                                {activeTab === 'history' && 'Historial de Registros'}
                                {activeTab === 'system_users' && 'Usuarios del Sistema'}
                                {activeTab === 'shifts' && 'Gestión de Turnos'}
                            </h2>
                        </div>
                        {/* Only show "Sistema Operativo" badge on Desktop to save space */}
                        {!isMobile && (
                            <div className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                                <div style={{ width: '8px', height: '8px', background: '#22C55E', borderRadius: '50%' }}></div>
                                Sistema Operativo
                            </div>
                        )}
                    </header>

                    {activeTab === 'dashboard' && <DashboardView isMobile={isMobile} />}
                    {activeTab === 'personal' && <PersonnelView isMobile={isMobile} />}
                    {activeTab === 'history' && <HistoryView isMobile={isMobile} />}
                    {activeTab === 'system_users' && userRole === 'admin' && <SystemUsersView isMobile={isMobile} />}
                    {activeTab === 'shifts' && <ShiftsView isMobile={isMobile} />}
                </div>
            </main>
        </div>
    );
}

// ... NavBtn stays same ...

// Pass isMobile prop down to Views
function DashboardView({ isMobile }) {
    // ... existing logic ...
    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "active_parking"));
        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setVehicles(data);
        });
        return unsubscribe;
    }, []);

    const autos = vehicles.filter(v => v.vehicleType === 'auto').length;
    const motos = vehicles.filter(v => v.vehicleType === 'moto').length;
    const libres = vehicles.filter(v => v.type === 'libre').length;

    return (
        <div>
            <div className="grid-dashboard" style={{
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))'
            }}>
                <KPICard title="Total Vehículos" value={vehicles.length} icon={<Car size={28} />} color="blue" trend="+12% vs ayer" />
                <KPICard title="Autos" value={autos} icon={<Car size={28} />} color="indigo" />
                <KPICard title="Motos" value={motos} icon={<Bike size={28} />} color="purple" />
            </div>
            {/* ... Table logic ... */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3>Ocupación Actual</h3>
                    <div className="input-group" style={{ marginBottom: 0, width: '100%', maxWidth: '300px' }}>
                        <input className="input" placeholder="Buscar placa..." style={{ padding: '0.5rem 1rem' }} />
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Placa</th>
                                <th>Conductor</th>
                                {!isMobile && <th>Vehículo</th>}
                                <th>Tipo</th>
                                {!isMobile && <th>Tiempo</th>}
                                {!isMobile && <th>Estado</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.map(v => (
                                <tr key={v.id}>
                                    <td><span style={{ fontFamily: 'monospace', fontWeight: 'bold', background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{v.plate}</span></td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{v.driverName}</div>
                                    </td>
                                    {!isMobile && <td style={{ textTransform: 'capitalize' }}>{v.vehicleType}</td>}
                                    <td>
                                        <span className={`badge badge-${v.type === 'personal' ? 'primary' : 'warning'}`}>{v.type}</span>
                                    </td>
                                    {!isMobile && <td>...</td>}
                                    {!isMobile && <td><span className="badge badge-success">Activo</span></td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ... KPICard stays same ...

function PersonnelView({ isMobile }) {
    // ... existing logic ...
    const [personnel, setPersonnel] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newItem, setNewItem] = useState({ fullName: '', dni: '', role: '', licensePlate: '', vehicleType: 'auto' });

    useEffect(() => {
        const q = query(collection(db, "personnel"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snap) => setPersonnel(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return unsubscribe;
    }, []);

    // ... handleSubmit ...
    const handleSubmit = async (e) => {
        e.preventDefault();
        // ... (Keep existing submit logic)
        const names = newItem.fullName.split(' ');
        const firstName = names[0];
        const lastName = names.slice(1).join(' ') || '';

        await addDoc(collection(db, "personnel"), {
            firstName,
            lastName,
            fullName: newItem.fullName, // Keep full name for future use
            dni: newItem.dni,
            role: newItem.role,
            licensePlate: newItem.licensePlate.toUpperCase(),
            vehicleType: newItem.vehicleType,
            createdAt: serverTimestamp()
        });
        setShowForm(false);
        setNewItem({ fullName: '', dni: '', role: '', licensePlate: '', vehicleType: 'auto' });
        alert('Personal registrado correctamente');
    };

    // ... handleDelete ...
    const handleDelete = async (id) => {
        if (confirm('¿Seguro de eliminar a este personal?')) await deleteDoc(doc(db, "personnel", id));
    }

    // ... handleFileUpload ...
    const [uploading, setUploading] = useState(false);
    const handleFileUpload = async (e) => {
        // ... (Keep existing logic)
    }


    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Adjustments */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', marginBottom: '2rem', alignItems: isMobile ? 'flex-start' : 'center', gap: '1rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: '#0F172A' }}>Personal Autorizado</h3>
                    <p className="text-muted">Directorio de personal médico y administrativo.</p>
                </div>
                {/* Mobile Actions Stack */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                    <button
                        className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
                        onClick={() => setShowForm(!showForm)}
                        style={{ flex: isMobile ? 1 : 'none' }}
                    >
                        {showForm ? 'Cancelar' : <><Plus size={18} /> Registrar</>}
                    </button>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="card fade-in" style={{ marginBottom: '2rem', borderLeft: '4px solid #10B981' }}>
                    {/* ... Form input fields (simplify grid for mobile) ... */}
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label className="label">Nombre Completo</label>
                                <input className="input" required value={newItem.fullName} onChange={e => setNewItem({ ...newItem, fullName: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="label">DNI</label>
                                <input className="input" required value={newItem.dni} onChange={e => setNewItem({ ...newItem, dni: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="label">Cargo</label>
                                <input className="input" required value={newItem.role} onChange={e => setNewItem({ ...newItem, role: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="label">Placa</label>
                                <input className="input" required value={newItem.licensePlate} onChange={e => setNewItem({ ...newItem, licensePlate: e.target.value.toUpperCase() })} />
                            </div>
                            <div className="input-group">
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>Guardar</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid-dashboard" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {personnel.map(p => (
                    <div key={p.id} className="card" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{
                                width: '48px', height: '48px',
                                background: '#EFF6FF', borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#2563EB', fontWeight: 'bold'
                            }}>
                                {p.firstName?.[0] || '?'}{p.lastName?.[0] || ''}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{p.firstName} {p.lastName}</h3>
                                <span style={{ color: '#64748B', fontSize: '0.85rem' }}>{p.role}</span>
                            </div>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{p.licensePlate}</span>
                            <div className={`badge ${p.vehicleType === 'moto' ? 'badge-warning' : 'badge-primary'}`}>{p.vehicleType}</div>
                        </div>
                        <button className="btn-icon" onClick={() => handleDelete(p.id)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#EF4444' }}><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HistoryView() {
    const [history, setHistory] = useState([]);
    useEffect(() => {
        const q = query(collection(db, "history"), orderBy("entryTime", "desc"), limit(50));
        const unsubscribe = onSnapshot(q, (snap) => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return unsubscribe;
    }, []);

    return (
        <div className="card">
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Placa</th>
                            <th>Conductor</th>
                            <th>Ingreso</th>
                            <th>Salida</th>
                            <th>Duración</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(h => {
                            const start = h.entryTime?.toDate();
                            const end = h.exitTime?.toDate();
                            const duration = end && start ? Math.round((end - start) / 60000) + ' min' : '-';
                            return (
                                <tr key={h.id}>
                                    <td><span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{h.plate}</span></td>
                                    <td>{h.driverName}</td>
                                    <td>{start?.toLocaleString()}</td>
                                    <td>{end?.toLocaleString()}</td>
                                    <td><span className="badge badge-primary">{duration}</span></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ShiftsView() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "users"), where("role", "==", "agent"));
        const unsubscribe = onSnapshot(q, (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return unsubscribe;
    }, []);

    const toggleShift = async (user) => {
        await updateDoc(doc(db, "users", user.id), {
            onShift: !user.onShift,
            lastShiftUpdate: serverTimestamp()
        });
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: '#0F172A' }}>Control de Turnos</h3>
                <p className="text-muted">Gestione la disponibilidad de los agentes en tiempo real.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {users.map(u => (
                    <div key={u.id} className="card" style={{
                        padding: '1.25rem',
                        border: u.onShift ? '1px solid #86EFAC' : '1px solid #FED7AA',
                        background: u.onShift ? '#F0FDF4' : '#FFF7ED',
                        transition: 'all 0.2s'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: u.onShift ? '#DCFCE7' : '#FFEDD5',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: u.onShift ? '#16A34A' : '#EA580C'
                                }}>
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B', margin: 0 }}>{u.username}</h4>
                                    <p style={{ fontSize: '0.75rem', color: u.onShift ? '#15803D' : '#C2410C', margin: 0 }}>
                                        {u.onShift ? 'Habilitado' : 'Inhabilitado'}
                                    </p>
                                </div>
                            </div>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.onShift ? '#22C55E' : '#F97316' }}></div>
                        </div>

                        <button
                            onClick={() => toggleShift(u)}
                            className="btn"
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                fontSize: '0.85rem',
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                background: 'white',
                                border: `1px solid ${u.onShift ? '#FECACA' : '#BBF7D0'}`,
                                color: u.onShift ? '#EF4444' : '#16A34A',
                                fontWeight: 600
                            }}
                        >
                            {u.onShift ? 'Cerrar Turno' : 'Habilitar Turno'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function SystemUsersView() {
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'agent' });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const q = query(collection(db, "users"), where("isSystemUser", "==", true));
        const unsubscribe = onSnapshot(q, (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return unsubscribe;
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        const res = await createSystemUser(newUser.username, newUser.password, newUser.role);

        if (res.success) {
            setShowForm(false);
            setNewUser({ username: '', password: '', role: 'agent' });
            alert('Usuario creado correctamente!');
        } else {
            setMsg('Error: ' + res.error);
        }
        setLoading(false);
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: '#0F172A' }}>Usuarios del Sistema</h3>
                    <p className="text-muted">Gestión de accesos y credenciales.</p>
                </div>
                <button
                    className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
                    onClick={() => setShowForm(!showForm)}
                    style={{ transition: 'all 0.3s' }}
                >
                    {showForm ? 'Cancelar Registro' : <><UserPlus size={18} /> Nuevo Usuario</>}
                </button>
            </div>

            {showForm && (
                <div className="card fade-in" style={{ marginBottom: '2rem', borderLeft: '4px solid #2563EB', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ background: '#EFF6FF', padding: '0.5rem', borderRadius: '50%', color: '#2563EB' }}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1E293B' }}>Nueva Credencial</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Complete los datos para generar el acceso.</p>
                        </div>
                    </div>

                    {msg && <div className="badge badge-danger" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>{msg}</div>}

                    <form onSubmit={handleCreate}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label className="label">Usuario</label>
                                <input
                                    className="input"
                                    required
                                    value={newUser.username}
                                    onChange={e => setNewUser({ ...newUser, username: e.target.value.replace(/\s/g, '') })}
                                    placeholder="Ej: supervisor1"
                                />
                            </div>
                            <div className="input-group">
                                <label className="label">Contraseña</label>
                                <input
                                    type="password"
                                    className="input"
                                    required
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="MIN 6 caracteres"
                                />
                            </div>
                            <div className="input-group">
                                <label className="label">Rol</label>
                                <select
                                    className="input"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="agent">Agente (Móvil)</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.9rem', height: '52px' }}>
                                    {loading ? 'Guardando...' : 'Guardar y Crear'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid-dashboard">
                {users.map(u => (
                    <div key={u.id} className="card" style={{ transition: 'all 0.2s', border: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{
                                background: u.role === 'admin' ? '#EFF6FF' : u.role === 'supervisor' ? '#FFF7ED' : '#F0FDF4',
                                padding: '1rem', borderRadius: '1rem',
                                color: u.role === 'admin' ? '#2563EB' : u.role === 'supervisor' ? '#EA580C' : '#16A34A'
                            }}>
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>{u.username}</h3>
                                <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>{u.email}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F8FAFC', paddingTop: '1rem' }}>
                            <div className={`badge badge-${u.role === 'admin' ? 'primary' : u.role === 'supervisor' ? 'warning' : 'success'}`}>
                                {u.role === 'admin' ? 'Admin' : u.role === 'supervisor' ? 'Supervisor' : 'Agente'}
                            </div>
                            {u.onShift && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }} title="Turno Activo"></div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
