import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, orderBy, limit, serverTimestamp, where, updateDoc, writeBatch } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { LogOut, Car, Bike, Users, LayoutDashboard, History, Plus, Trash2, Search, Clock, Shield, UserPlus, UserCheck, ToggleLeft, ToggleRight, Scale, UploadCloud, FileSpreadsheet, Menu, X, ShieldCheck, Lock, Building2, MapPin, Edit, CheckCircle } from 'lucide-react';
import { createSystemUser } from '../utils/adminAuth';
import { useAuth } from '../contexts/AuthContext';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: '#EF4444', textAlign: 'center', background: '#FEF2F2', borderRadius: '1rem', margin: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Algo salió mal en esta vista.</h3>
                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Intenta recargar o contacta soporte.</p>
                    <button className="btn btn-primary" onClick={() => this.setState({ hasError: false })} style={{ marginTop: '1rem' }}>Reintentar</button>
                    <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: '#999' }}>Error: {this.state.error?.toString()}</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { userRole } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    // console.log("AdminDashboard Loaded Clean");

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        // Fetch User Info
        if (auth.currentUser) {
            const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
                if (doc.exists()) setCurrentUser(doc.data());
            });
            return () => {
                window.removeEventListener('resize', handleResize);
                unsub();
            }
        }

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
                        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                            <span>Hospital Parking</span>
                            {userRole === 'supervisor' && currentUser?.hospital && (
                                <span style={{ fontSize: '0.75rem', color: '#60A5FA', textTransform: 'uppercase' }}>{currentUser.hospital}</span>
                            )}
                        </h1>
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
                            <h1 style={{ fontSize: '1.25rem', color: 'white', lineHeight: 1.2 }}>
                                {userRole === 'supervisor' ? 'Supervisor' : 'Panel Control'}
                            </h1>
                            {userRole === 'supervisor' && currentUser?.hospital && (
                                <p style={{ fontSize: '0.8rem', color: '#60A5FA', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {currentUser.hospital}
                                </p>
                            )}
                            {userRole === 'admin' && <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>Administración</p>}
                        </div>
                    </div>
                )}

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <NavBtn icon={<LayoutDashboard size={20} />} label="Dashboard General" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); closeMenu(); }} />
                    <NavBtn icon={<Users size={20} />} label="Gestión Personal" active={activeTab === 'personal'} onClick={() => { setActiveTab('personal'); closeMenu(); }} />
                    <NavBtn icon={<History size={20} />} label="Historial Accesos" active={activeTab === 'history'} onClick={() => { setActiveTab('history'); closeMenu(); }} />

                    <div style={{ margin: '0.5rem 0', borderTop: '1px solid #1E293B' }}></div>
                    <NavBtn icon={<UserCheck size={20} />} label="Control de Turnos" active={activeTab === 'shifts'} onClick={() => { setActiveTab('shifts'); closeMenu(); }} />
                    {userRole === 'admin' && <NavBtn icon={<Building2 size={20} />} label="Gestión Sedes" active={activeTab === 'locations'} onClick={() => { setActiveTab('locations'); closeMenu(); }} />}

                    {userRole === 'admin' && (
                        <>
                            <NavBtn icon={<Shield size={20} />} label="Usuarios Sistema" active={activeTab === 'system_users'} onClick={() => { setActiveTab('system_users'); closeMenu(); }} />
                        </>
                    )}
                </nav>

                <div style={{ paddingBottom: isMobile ? '2rem' : 0 }}>
                    {/* User footer removed - moved to header */}
                </div>
            </aside>


            {/* Main Content Area */}
            <main className="main-content" style={{
                flex: 1,
                padding: isMobile ? '0.5rem' : '1rem', // Reduced padding
                overflowY: 'auto'
            }}>
                <div className="fade-in">
                    <header style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', lineHeight: 1.2 }}>
                                {activeTab === 'dashboard' && 'Visión General'}
                                {activeTab === 'personal' && 'Personal Autorizado'}
                                {activeTab === 'history' && 'Historial de Registros'}
                                {activeTab === 'system_users' && 'Usuarios del Sistema'}
                                {activeTab === 'shifts' && 'Gestión de Turnos'}
                                {activeTab === 'locations' && 'Sedes y Puertas'}
                            </h2>
                        </div>
                        {!isMobile && currentUser && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1E293B' }}>{currentUser.fullName || currentUser.username}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'capitalize' }}>{currentUser.role || userRole}</div>
                                </div>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: '#2563EB', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: '1rem'
                                }}>
                                    {(currentUser.fullName || currentUser.username || "U")[0].toUpperCase()}
                                </div>
                                <button
                                    onClick={() => signOut(auth)}
                                    className="btn-icon"
                                    style={{
                                        color: '#EF4444', background: '#FEF2F2', border: '1px solid #FECACA',
                                        width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', transition: 'all 0.2s', marginLeft: '0.25rem'
                                    }}
                                    title="Cerrar Sesión"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        )}
                    </header>

                    <ErrorBoundary key={activeTab}>
                        {activeTab === 'dashboard' && <DashboardView isMobile={isMobile} />}
                        {activeTab === 'personal' && <PersonnelView isMobile={isMobile} />}
                        {activeTab === 'history' && <HistoryView isMobile={isMobile} />}
                        {activeTab === 'system_users' && userRole === 'admin' && <SystemUsersView isMobile={isMobile} />}
                        {activeTab === 'shifts' && <ShiftsView isMobile={isMobile} />}
                        {activeTab === 'locations' && <LocationsView isMobile={isMobile} />}
                    </ErrorBoundary>
                </div>
            </main>
        </div>
    );
}

function NavBtn({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                width: '100%', padding: '0.75rem 1rem',
                background: active ? '#1E293B' : 'transparent',
                color: active ? 'white' : '#94A3B8',
                border: 'none', borderRadius: '0.5rem',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s',
                fontWeight: active ? 600 : 400
            }}
        >
            <span style={{ color: active ? '#3B82F6' : 'currentColor' }}>{icon}</span>
            <span>{label}</span>
        </button>
    );
}

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
                gridTemplateColumns: isMobile ? '1fr ' : 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.5rem', marginBottom: '0.5rem'
            }}>
                <KPICard title="Total Vehículos" value={vehicles.length} icon={<Car size={28} />} color="blue" trend="+12% vs ayer" />
                <KPICard title="Autos" value={autos} icon={<Car size={28} />} color="indigo" />
                <KPICard title="Motos" value={motos} icon={<Bike size={28} />} color="purple" />
            </div>

            {/* Top 5 Longest Stays - Compact */}
            <div className="card" style={{ marginBottom: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: '#FEF2F2', padding: '0.25rem', borderRadius: '0.25rem', color: '#DC2626' }}>
                        <Clock size={16} />
                    </div>
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>Mayor Estancia (Top 5)</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '0.25rem' }}>
                        {vehicles
                            .map(v => ({
                                ...v,
                                durationMs: v.entryTime && v.entryTime.toDate ? (new Date() - v.entryTime.toDate()) : 0
                            }))
                            .sort((a, b) => b.durationMs - a.durationMs)
                            .slice(0, 5)
                            .map((v, i) => {
                                const hours = Math.floor(v.durationMs / (1000 * 60 * 60));
                                const minutes = Math.floor((v.durationMs % (1000 * 60 * 60)) / (1000 * 60));
                                return (
                                    <div key={v.id} style={{
                                        minWidth: '160px',
                                        background: i === 0 ? '#FEF2F2' : '#F8FAFC',
                                        border: i === 0 ? '1px solid #FECACA' : '1px solid #E2E8F0',
                                        borderRadius: '0.5rem',
                                        padding: '0.5rem',
                                        flex: 1
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '0.9rem' }}>{v.plate}</span>
                                            <span className={`badge ${i === 0 ? 'badge-danger' : 'badge-primary'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem' }}>
                                                #{i + 1}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '0.1rem' }}>
                                            {v.driverName ? v.driverName.substring(0, 15) + (v.driverName.length > 15 ? '...' : '') : 'Desc.'}
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: i === 0 ? '#DC2626' : '#0F172A', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Clock size={12} />
                                            {hours}h {minutes}m
                                        </div>
                                    </div>
                                );
                            })}
                        {vehicles.length === 0 && <p className="text-muted" style={{ padding: '0.5rem', fontSize: '0.8rem' }}>Sin vehículos.</p>}
                    </div>
                </div>
            </div>
            {/* ... Table logic ... */}
            <div className="card" style={{ padding: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>Ocupación Actual</h3>
                    <div className="input-group" style={{ marginBottom: 0, width: '100%', maxWidth: '200px' }}>
                        <input className="input" placeholder="Buscar..." style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} />
                    </div>
                </div>

                <div className="table-container">
                    <table style={{ fontSize: '0.85rem' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '0.5rem' }}>Placa</th>
                                <th style={{ padding: '0.5rem' }}>Conductor</th>
                                {!isMobile && <th style={{ padding: '0.5rem' }}>Vehículo</th>}
                                <th style={{ padding: '0.5rem' }}>Tipo</th>
                                {!isMobile && <th style={{ padding: '0.5rem' }}>Tiempo</th>}
                                {!isMobile && <th style={{ padding: '0.5rem' }}>Estado</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.map(v => (
                                <tr key={v.id}>
                                    <td style={{ padding: '0.5rem' }}><span style={{ fontFamily: 'monospace', fontWeight: 'bold', background: '#F1F5F9', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{v.plate}</span></td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <div style={{ fontWeight: 500 }}>{v.driverName}</div>
                                    </td>
                                    {!isMobile && <td style={{ textTransform: 'capitalize', padding: '0.5rem' }}>{v.vehicleType}</td>}
                                    <td style={{ padding: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748B' }}>
                                            <Clock size={12} />
                                            {v.entryTime && v.entryTime.toDate ? v.entryTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem' }}><span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem' }}>Activo</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon, color, trend }) {
    const bgColors = {
        blue: '#EFF6FF',
        indigo: '#EEF2FF',
        purple: '#F3E8FF',
        green: '#F0FDF4',
        orange: '#FFF7ED',
        red: '#FEF2F2'
    };
    const textColors = {
        blue: '#2563EB',
        indigo: '#4F46E5',
        purple: '#9333EA',
        green: '#16A34A',
        orange: '#EA580C',
        red: '#DC2626'
    };

    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem' }}>
            <div style={{
                background: bgColors[color] || bgColors.blue,
                padding: '0.5rem', borderRadius: '0.75rem',
                color: textColors[color] || textColors.blue,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {React.cloneElement(icon, { size: 20 })}
            </div>
            <div>
                <p style={{ color: '#64748B', fontSize: '0.75rem', marginBottom: '0', fontWeight: 500 }}>{title}</p>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, lineHeight: 1 }}>{value}</h3>
                {trend && <div style={{ fontSize: '0.65rem', color: '#16A34A', marginTop: '0', fontWeight: 500 }}>{trend}</div>}
            </div>
        </div>
    );
}

function PersonnelView({ isMobile }) {
    const [personnel, setPersonnel] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newItem, setNewItem] = useState({ fullName: '', dni: '', role: '', licensePlate: '', vehicleType: 'auto' });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "personnel"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snap) => {
            setPersonnel(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return unsubscribe;
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newItem.fullName || !newItem.licensePlate) return;

        try {
            const names = newItem.fullName.split(' ');
            const firstName = names[0];
            const lastName = names.slice(1).join(' ') || '';

            await addDoc(collection(db, "personnel"), {
                firstName,
                lastName,
                fullName: newItem.fullName,
                dni: newItem.dni,
                role: newItem.role,
                licensePlate: newItem.licensePlate.toUpperCase(),
                vehicleType: newItem.vehicleType,
                createdAt: serverTimestamp()
            });
            setShowForm(false);
            setNewItem({ fullName: '', dni: '', role: '', licensePlate: '', vehicleType: 'auto' });
        } catch (error) {
            console.error("Error creating personal:", error);
            alert("Error al guardar personal");
        }
    };

    const handleDelete = async (id) => {
        if (confirm('¿Seguro de eliminar a este personal?')) {
            try {
                await deleteDoc(doc(db, "personnel", id));
            } catch (error) {
                console.error("Error creating personal:", error);
            }
        }
    }

    const handleFileUpload = async (e) => {
        alert("La importación está desactivada temporalmente para solucionar el error en móviles.");
        // Code removed to prevent mobile crash
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', marginBottom: '2rem', alignItems: isMobile ? 'flex-start' : 'center', gap: '1rem' }}>
                <div>
                    {/* Title removed to avoid duplication */}
                    <p className="text-muted" style={{ marginTop: 0 }}>Directorio de personal médico y administrativo.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                    {!isMobile && (
                        <div style={{ position: 'relative' }}>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                disabled={uploading}
                            />
                            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} disabled={uploading}>
                                <UploadCloud size={16} /> Importar
                            </button>
                        </div>
                    )}

                    <button
                        className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
                        onClick={() => setShowForm(!showForm)}
                        style={{ flex: isMobile ? 1 : 'none', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                        {showForm ? 'Cancelar' : <><Plus size={16} /> Nuevo</>}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="card fade-in" style={{ marginBottom: '2rem', borderLeft: '4px solid #10B981' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label className="label">Nombre Completo</label>
                                <input className="input" required value={newItem.fullName} onChange={e => setNewItem({ ...newItem, fullName: e.target.value })} placeholder="Ej: Dr. Juan Perez" />
                            </div>
                            <div className="input-group">
                                <label className="label">DNI</label>
                                <input className="input" value={newItem.dni} onChange={e => setNewItem({ ...newItem, dni: e.target.value })} placeholder="Opcional" />
                            </div>
                            <div className="input-group">
                                <label className="label">Cargo</label>
                                <input className="input" required value={newItem.role} onChange={e => setNewItem({ ...newItem, role: e.target.value })} placeholder="Ej: Pediatría" />
                            </div>
                            <div className="input-group">
                                <label className="label">Placa</label>
                                <input className="input" required value={newItem.licensePlate} onChange={e => setNewItem({ ...newItem, licensePlate: e.target.value.toUpperCase() })} placeholder="ABC-123" />
                            </div>
                            <div className="input-group">
                                <label className="label">Tipo</label>
                                <select className="input" value={newItem.vehicleType} onChange={e => setNewItem({ ...newItem, vehicleType: e.target.value })}>
                                    <option value="auto">Auto</option>
                                    <option value="moto">Moto</option>
                                </select>
                            </div>
                            <div className="input-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px' }}>Guardar</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid-dashboard" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                {personnel.map(p => (
                    <div key={p.id || Math.random()} className="card" style={{ position: 'relative', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: '36px', height: '36px',
                                background: '#EFF6FF', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#2563EB', fontWeight: 'bold', fontSize: '1rem'
                            }}>
                                {(p.firstName && p.firstName[0]) ? p.firstName[0] : (p.fullName ? p.fullName[0] : '?')}
                            </div>
                            <div style={{ overflow: 'hidden', paddingRight: '1.5rem', flex: 1 }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {p.firstName ? `${p.firstName} ${p.lastName || ''}` : p.fullName}
                                </h3>
                                <div style={{ color: '#64748B', fontSize: '0.75rem' }}>{p.role}</div>
                            </div>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.95rem' }}>{p.licensePlate}</span>
                            <div className={`badge ${p.vehicleType === 'moto' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                {p.vehicleType === 'moto' ? 'Moto' : 'Auto'}
                            </div>
                        </div>
                        <button className="btn-icon" onClick={() => handleDelete(p.id)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: '#EF4444' }}><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>

            {personnel.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 1rem',
                    color: '#94A3B8',
                    background: '#F8FAFC',
                    borderRadius: '1rem',
                    border: '2px dashed #E2E8F0',
                    marginTop: '2rem'
                }}>
                    <Users size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>No hay personal registrado aún.</p>
                </div>
            )}
        </div>
    );
}

function HistoryView({ isMobile }) {
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Increased limit to 100 to allow better client-side filtering
        const q = query(collection(db, "history"), orderBy("entryTime", "desc"), limit(100));
        const unsubscribe = onSnapshot(q, (snap) => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return unsubscribe;
    }, []);

    const formatDuration = (start, end) => {
        if (!start || !end) return '-';
        const diff = end - start;
        if (diff < 0) return '-';

        const totalMinutes = Math.floor(diff / 60000);
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;

        if (days > 0) return `${days}d ${hours}h ${minutes}min`;
        if (hours > 0) return `${hours}h ${minutes}min`;
        return `${minutes}min`;
    };

    const filteredHistory = history.filter(h =>
        (h.plate && h.plate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (h.driverName && h.driverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (h.agentName && h.agentName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <div className="input-group" style={{ marginBottom: 0, width: '100%', maxWidth: '300px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            className="input"
                            placeholder="Buscar placa, conductor o agente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem', padding: '0.4rem 0.4rem 0.4rem 2.5rem', fontSize: '0.9rem' }}
                        />
                    </div>
                </div>
            </div>

            {isMobile ? (
                <div className="grid-dashboard" style={{ gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                    {filteredHistory.map(h => {
                        const start = h.entryTime && h.entryTime.toDate ? h.entryTime.toDate() : null;
                        const end = h.exitTime && h.exitTime.toDate ? h.exitTime.toDate() : null;
                        const duration = formatDuration(start, end);
                        return (
                            <div key={h.id} className="card" style={{ padding: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1rem' }}>{h.plate}</span>
                                    <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>{duration}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#1E293B', marginBottom: '0.25rem' }}>{h.driverName}</div>
                                {h.hospital && <div style={{ fontSize: '0.75rem', color: '#2563EB', marginBottom: '0.25rem' }}>{h.hospital} - {h.gate}</div>}
                                <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>In: {start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                    <span>Out: {end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                </div>
                            </div>
                        );
                    })}
                    {filteredHistory.length === 0 && <p className="text-muted text-center">No se encontraron registros.</p>}
                </div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Placa</th>
                                    <th>Conductor / Agente</th>
                                    <th>Ubicación</th>
                                    <th>Ingreso</th>
                                    <th>Salida</th>
                                    <th>Duración</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHistory.map(h => {
                                    const start = h.entryTime && h.entryTime.toDate ? h.entryTime.toDate() : null;
                                    const end = h.exitTime && h.exitTime.toDate ? h.exitTime.toDate() : null;
                                    const duration = formatDuration(start, end);
                                    return (
                                        <tr key={h.id}>
                                            <td><span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{h.plate}</span></td>
                                            <td>
                                                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{h.driverName}</div>
                                                {h.agentName && <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Por: {h.agentName}</div>}
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.85rem', color: '#2563EB', fontWeight: 500 }}>{h.hospital || '-'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{h.gate || '-'}</div>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{start ? start.toLocaleString() : '-'}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{end ? end.toLocaleString() : '-'}</td>
                                            <td><span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>{duration}</span></td>
                                        </tr>
                                    )
                                })}
                                {filteredHistory.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center" style={{ padding: '2rem' }}>No se encontraron registros coincidentes.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function ShiftsView({ isMobile }) {
    const [users, setUsers] = useState([]);
    const [locations, setLocations] = useState([]);
    const { userRole } = useAuth();
    const [editingGateUserId, setEditingGateUserId] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "users"), where("role", "==", "agent"));
        const unsubscribe = onSnapshot(q, (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return unsubscribe;
    }, []);

    useEffect(() => {
        const q = query(collection(db, "locations"), orderBy("name"));
        return onSnapshot(q, snap => setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    const toggleShift = async (user) => {
        try {
            await updateDoc(doc(db, "users", user.id), {
                onShift: !user.onShift,
                lastShiftUpdate: serverTimestamp()
            });
        } catch (e) { console.error(e); }
    }

    const updateGate = async (userId, newGate) => {
        try {
            await updateDoc(doc(db, "users", userId), { gate: newGate });
            setEditingGateUserId(null);
        } catch (e) { console.error(e); alert("Error al actualizar puerta"); }
    }

    return (
        <div className="fade-in">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#0F172A', fontWeight: 700 }}>Gestión de Turnos</h3>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {users.map(u => {
                    const userLocation = locations.find(l => l.name === u.hospital);
                    const gates = userLocation ? (userLocation.gates || []) : [];
                    const isEditing = editingGateUserId === u.id;
                    const canEdit = (userRole === 'supervisor' || userRole === 'admin');

                    return (
                        <div key={u.id} className="card" style={{
                            padding: '0.75rem',
                            border: u.onShift ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                            background: u.onShift ? '#F0FDF4' : '#FFFFFF',
                            transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: u.onShift ? '#DCFCE7' : '#F1F5F9',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: u.onShift ? '#16A34A' : '#64748B'
                                    }}>
                                        <Shield size={16} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{u.username}</h4>
                                        <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span>{u.hospital || 'Sin Sede'}</span>
                                            <span>•</span>
                                            {isEditing ? (
                                                <select
                                                    autoFocus
                                                    className="input"
                                                    style={{ padding: '0 0.25rem', height: 'auto', fontSize: '0.75rem', width: 'auto' }}
                                                    value={u.gate}
                                                    onChange={(e) => updateGate(u.id, e.target.value)}
                                                    onBlur={() => setEditingGateUserId(null)}
                                                >
                                                    {gates.map(g => <option key={g} value={g}>{g}</option>)}
                                                </select>
                                            ) : (
                                                <span
                                                    onClick={() => canEdit && setEditingGateUserId(u.id)}
                                                    style={{ cursor: canEdit ? 'pointer' : 'default', borderBottom: canEdit ? '1px dashed #94A3B8' : 'none', fontWeight: 500 }}
                                                    title={canEdit ? "Clic para cambiar puerta" : ""}
                                                >
                                                    {u.gate || 'Sin Puerta'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={`badge ${u.onShift ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                                    {u.onShift ? 'ACTIVO' : 'INACTIVO'}
                                </div>
                            </div>

                            <button
                                onClick={() => toggleShift(u)}
                                className="btn"
                                style={{
                                    width: '100%',
                                    padding: '0.4rem',
                                    fontSize: '0.8rem',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem',
                                    background: u.onShift ? '#FEF2F2' : '#F0FDF4',
                                    border: `1px solid ${u.onShift ? '#FECACA' : '#BBF7D0'}`,
                                    color: u.onShift ? '#DC2626' : '#16A34A',
                                    fontWeight: 600,
                                    borderRadius: '0.375rem'
                                }}
                            >
                                {u.onShift ? <><LogOut size={14} /> Cerrar Turno</> : <><CheckCircle size={14} /> Habilitar Turno</>}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

function SystemUsersView() {
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'agent', dni: '', fullName: '', phone: '', hospital: '', gate: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const q = query(collection(db, "users"), where("isSystemUser", "==", true));
        const unsubscribe = onSnapshot(q, (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return unsubscribe;
    }, []);

    // Fetch locations for dropdown
    const [locations, setLocations] = useState([]);
    useEffect(() => {
        const q = query(collection(db, "locations"), orderBy("name"));
        return onSnapshot(q, snap => setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    const selectedLoc = locations.find(l => l.name === newUser.hospital);
    const availableGates = selectedLoc ? (selectedLoc.gates || []) : [];

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');

        if (editingUser) {
            // Update logic (Firestore only)
            try {
                await updateDoc(doc(db, "users", editingUser.id), {
                    dni: newUser.dni,
                    fullName: newUser.fullName,
                    phone: newUser.phone,
                    hospital: newUser.hospital,
                    gate: newUser.gate,
                    role: newUser.role,
                    // username/email/password cant be easily updated without admin SDK or re-auth, 
                    // so we skip them or warn user. For now only metadata.
                });
                alert('Usuario actualizado. Nota: Credenciales (Usuario/Pass) no se cambian aquí.');
                setShowForm(false);
                setNewUser({ username: '', password: '', role: 'agent', dni: '', fullName: '', phone: '', hospital: '', gate: '' });
                setEditingUser(null);
            } catch (err) {
                console.error(err);
                setMsg('Error al actualizar: ' + err.message);
            }
        } else {
            // Create logic
            const res = await createSystemUser(newUser.username, newUser.password, newUser.role, {
                dni: newUser.dni,
                fullName: newUser.fullName,
                phone: newUser.phone,
                hospital: newUser.hospital,
                gate: newUser.gate
            });

            if (res.success) {
                setShowForm(false);
                setNewUser({ username: '', password: '', role: 'agent', dni: '', fullName: '', phone: '', hospital: '', gate: '' });
                alert('Usuario creado correctamente!');
            } else {
                setMsg('Error: ' + res.error);
            }
        }
        setLoading(false);
    }

    const startEdit = (user) => {
        setEditingUser(user);
        setNewUser({
            username: user.username,
            password: '', // Password field blank on edit
            role: user.role,
            dni: user.dni || '',
            fullName: user.fullName || '',
            phone: user.phone || '',
            hospital: user.hospital || '',
            gate: user.gate || ''
        });
        setShowForm(true);
    }

    const cancelEdit = () => {
        setShowForm(false);
        setEditingUser(null);
        setNewUser({ username: '', password: '', role: 'agent', dni: '', fullName: '', phone: '', hospital: '', gate: '' });
    }

    const toggleStatus = async (user) => {
        if (!confirm(`¿${user.isDisabled ? 'Habilitar' : 'Inhabilitar'} usuario ${user.username}?`)) return;
        try {
            await updateDoc(doc(db, "users", user.id), {
                isDisabled: !user.isDisabled
            });
        } catch (e) {
            console.error(e);
            alert("Error al actualizar estado");
        }
    }

    const deleteUser = async (user) => {
        if (!confirm(`¿Estás seguro de ELIMINAR al usuario ${user.username}? Esta acción no se puede deshacer.`)) return;
        try {
            await deleteDoc(doc(db, "users", user.id));
            alert("Usuario eliminado correctamente.");
        } catch (e) {
            console.error(e);
            alert("Error al eliminar usuario: " + e.message);
        }
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', alignItems: 'center' }}>
                <button
                    className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
                    onClick={() => showForm ? cancelEdit() : setShowForm(true)}
                    style={{ transition: 'all 0.3s', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                >
                    {showForm ? 'Cancelar' : <><UserPlus size={16} /> Nuevo Usuario</>}
                </button>
            </div>

            {showForm && (
                <div className="card fade-in" style={{ marginBottom: '1rem', borderLeft: `4px solid ${editingUser ? '#F59E0B' : '#2563EB'}`, position: 'relative', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ background: editingUser ? '#FEF3C7' : '#EFF6FF', padding: '0.3rem', borderRadius: '50%', color: editingUser ? '#D97706' : '#2563EB' }}>
                            {editingUser ? <Edit size={16} /> : <Shield size={16} />}
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1E293B' }}>{editingUser ? 'Editar Usuario' : 'Nueva Credencial'}</h4>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>{editingUser ? 'Modifique los datos necesarios.' : 'Complete los datos.'}</p>
                        </div>
                    </div>

                    {msg && <div className="badge badge-danger" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>{msg}</div>}

                    <form onSubmit={handleCreate}>
                        {/* Datos Personales */}
                        <div style={{ marginBottom: '0.75rem' }}>
                            <h5 style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Información Personal</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>DNI</label>
                                    <input className="input" required value={newUser.dni} onChange={e => setNewUser({ ...newUser, dni: e.target.value })} placeholder="DNI" style={{ padding: '0.4rem' }} />
                                </div>
                                <div className="input-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                                    <label className="label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Nombres y Apellidos</label>
                                    <input className="input" required value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} placeholder="Nombre Completo" style={{ padding: '0.4rem' }} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Teléfono</label>
                                    <input className="input" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} placeholder="Celular" style={{ padding: '0.4rem' }} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Sede</label>
                                    <select
                                        className="input"
                                        value={newUser.hospital}
                                        onChange={e => setNewUser({ ...newUser, hospital: e.target.value, gate: '' })}
                                        style={{ padding: '0.4rem' }}
                                    >
                                        <option value="">Seleccione Sede</option>
                                        {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Puerta</label>
                                    <select
                                        className="input"
                                        value={newUser.gate}
                                        onChange={e => setNewUser({ ...newUser, gate: e.target.value })}
                                        style={{ padding: '0.4rem' }}
                                        disabled={!newUser.hospital}
                                    >
                                        <option value="">Seleccione Puerta</option>
                                        {availableGates.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Credenciales */}
                        <div style={{ marginBottom: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
                            <h5 style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Credenciales</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Usuario</label>
                                    <input
                                        className="input"
                                        required
                                        disabled={!!editingUser} // Cannot edit username
                                        value={newUser.username}
                                        onChange={e => setNewUser({ ...newUser, username: e.target.value.replace(/\s/g, '') })}
                                        placeholder="Ej: usuario"
                                        style={{ fontFamily: 'monospace', padding: '0.4rem', opacity: editingUser ? 0.7 : 1 }}
                                    />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Contraseña</label>
                                    <input
                                        type="password"
                                        className="input"
                                        required={!editingUser} // Not required on edit
                                        disabled={!!editingUser} // Disable password change for now
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder={editingUser ? "(No editable)" : "******"}
                                        style={{ padding: '0.4rem', opacity: editingUser ? 0.7 : 1 }}
                                    />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Rol</label>
                                    <select
                                        className="input"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                        style={{ padding: '0.4rem' }}
                                    >
                                        <option value="agent">Agente</option>
                                        <option value="supervisor">Supervisor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.5rem 1.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                                {loading ? 'Procesando...' : (editingUser ? 'Actualizar Datos' : 'Crear Usuario')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid-dashboard" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {users.map(u => (
                    <div key={u.id} className="card" style={{ transition: 'all 0.2s', border: '1px solid #F1F5F9', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{
                                background: u.role === 'admin' ? '#EFF6FF' : u.role === 'supervisor' ? '#FFF7ED' : '#F0FDF4',
                                padding: '0.5rem', borderRadius: '0.75rem',
                                color: u.role === 'admin' ? '#2563EB' : u.role === 'supervisor' ? '#EA580C' : '#16A34A'
                            }}>
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{u.username}</h3>
                                <p style={{ fontSize: '0.8rem', color: '#1E293B', margin: '2px 0 0 0', fontWeight: 500 }}>{u.fullName || 'Sin nombre'}</p>
                                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                                    {u.role === 'admin' ? 'Administrador' : u.role === 'supervisor' ? 'Supervisor' : 'Agente'}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid #F8FAFC', paddingTop: '0.75rem' }}>
                            {/* Role badge removed from here as requested to be under name */}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => startEdit(u)}
                                    className="badge badge-outline"
                                    style={{ fontSize: '0.7rem', padding: '0.2rem', cursor: 'pointer', border: 'none', background: 'white', color: '#64748B' }}
                                    title="Editar Usuario"
                                >
                                    <Edit size={12} /> EDITAR
                                </button>
                                {u.role !== 'admin' && (
                                    <button
                                        onClick={() => toggleStatus(u)}
                                        className={`badge ${u.isDisabled ? 'badge-danger' : 'badge-success'}`}
                                        style={{ fontSize: '0.7rem', padding: '0.2rem', cursor: 'pointer', border: 'none' }}
                                        title={u.isDisabled ? "Habilitar Acceso" : "Inhabilitar Acceso"}
                                    >
                                        {u.isDisabled ? <Lock size={12} /> : <ShieldCheck size={12} />}
                                        {u.isDisabled ? ' INACTIVO' : ' ACTIVO'}
                                    </button>
                                )}
                                {(u.role === 'agent' || u.role === 'supervisor') && (
                                    <button
                                        onClick={() => deleteUser(u)}
                                        className="badge badge-danger"
                                        style={{ fontSize: '0.7rem', padding: '0.2rem', cursor: 'pointer', border: 'none', background: '#FEE2E2', color: '#EF4444' }}
                                        title="Eliminar Usuario"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                                {u.onShift && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }} title="Turno Activo"></div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LocationsView({ isMobile }) {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newLocName, setNewLocName] = useState('');

    useEffect(() => {
        const q = query(collection(db, "locations"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snap) => setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return unsubscribe;
    }, []);

    const handleAddLoc = async (e) => {
        e.preventDefault();
        if (!newLocName.trim()) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "locations"), {
                name: newLocName.trim(),
                gates: ['Principal'] // Default gate
            });
            setNewLocName('');
        } catch (error) {
            console.error(error);
            alert("Error al crear sede");
        }
        setLoading(false);
    };

    const handleDeleteLoc = async (id) => {
        if (!confirm("¿Eliminar esta sede y todas sus configuraciones?")) return;
        try { await deleteDoc(doc(db, "locations", id)); } catch (e) { alert("Error al eliminar"); }
    };

    const handleAddGate = async (loc, newGateName) => {
        if (!newGateName.trim()) return;
        const updatedGates = [...(loc.gates || []), newGateName.trim()];
        await updateDoc(doc(db, "locations", loc.id), { gates: updatedGates });
    };

    const handleRemoveGate = async (loc, gateIdx) => {
        if (!confirm("¿Eliminar esta puerta?")) return;
        const updatedGates = loc.gates.filter((_, i) => i !== gateIdx);
        await updateDoc(doc(db, "locations", loc.id), { gates: updatedGates });
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="card fade-in" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={22} className="text-primary" /> Agregar Nueva Sede
                </h3>
                <form onSubmit={handleAddLoc} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        className="input"
                        value={newLocName}
                        onChange={e => setNewLocName(e.target.value)}
                        placeholder="Nombre de la Sede/Hospital"
                        required
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? '...' : <><Plus size={18} /> Agregar</>}
                    </button>
                </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {locations.map(loc => (
                    <div key={loc.id} className="card fade-in" style={{ padding: '1.5rem', position: 'relative', borderTop: '4px solid #2563EB' }}>
                        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                            <button onClick={() => handleDeleteLoc(loc.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }} title="Eliminar Sede">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building2 size={18} className="text-primary" />
                            {loc.name}
                        </h4>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h5 style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Puertas de Acceso</h5>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {(loc.gates || []).map((g, idx) => (
                                    <div key={idx} className="badge badge-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '0.5rem', background: 'white' }}>
                                        <MapPin size={12} className="text-muted" /> {g}
                                        <span
                                            onClick={() => handleRemoveGate(loc, idx)}
                                            style={{ cursor: 'pointer', marginLeft: 'auto', color: '#EF4444', display: 'flex', alignItems: 'center', padding: '2px', borderRadius: '4px' }}
                                            className="hover:bg-red-50"
                                        >
                                            <X size={12} />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    id={`new-gate-${loc.id}`}
                                    className="input"
                                    placeholder="Nueva Puerta..."
                                    style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddGate(loc, e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <button
                                    className="btn btn-sm btn-outline"
                                    onClick={() => {
                                        const input = document.getElementById(`new-gate-${loc.id}`);
                                        handleAddGate(loc, input.value);
                                        input.value = '';
                                    }}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {locations.length === 0 && <p className="text-muted" style={{ textAlign: 'center', marginTop: '3rem' }}>No hay sedes registradas. Agregue una para comenzar.</p>}
        </div>
    );
}
