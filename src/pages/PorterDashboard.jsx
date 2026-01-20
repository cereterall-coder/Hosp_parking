import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Camera, LogOut, Search, CheckCircle, AlertCircle, Car, Bike, ArrowLeft, AlertTriangle, ArrowRightLeft, LayoutDashboard, Clock } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { onSnapshot } from 'firebase/firestore';

export default function PorterDashboard() {
    const [currentUser, setCurrentUser] = useState(null);
    const [view, setView] = useState('flow'); // 'flow' | 'dashboard'

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(user => {
            if (user) {
                const unsubDoc = onSnapshot(doc(db, "users", user.uid), (d) => {
                    if (d.exists()) setCurrentUser(d.data());
                });
                return () => unsubDoc();
            } else {
                setCurrentUser(null);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    return (
        <div style={{ paddingBottom: '80px', minHeight: '100vh', background: '#F8FAFC' }}>
            <header style={{
                background: '#ffffff', padding: '1rem', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                position: 'sticky', top: 0, zIndex: 10,
                borderBottom: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '1.1rem', color: '#1E293B', fontWeight: '700', margin: 0 }}>Panel de Agente</h2>
                        {currentUser && (
                            <div style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 600, display: 'flex', gap: '0.25rem' }}>
                                <span>{currentUser.hospital || 'Sede Principal'}</span>
                                {currentUser.role !== 'supervisor' && (
                                    <>
                                        <span style={{ color: '#CBD5E1' }}>|</span>
                                        <span>{currentUser.gate || 'Entrada Principal'}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {currentUser && currentUser.role !== 'supervisor' && (
                        <button
                            onClick={() => setView(view === 'flow' ? 'dashboard' : 'flow')}
                            className={`btn-icon ${view === 'dashboard' ? 'active' : ''}`}
                            style={{
                                background: view === 'dashboard' ? '#EFF6FF' : '#F1F5F9',
                                color: view === 'dashboard' ? '#2563EB' : '#64748B',
                                padding: '0.5rem', borderRadius: '0.5rem'
                            }}
                        >
                            <LayoutDashboard size={20} />
                        </button>
                    )}
                    <button onClick={() => signOut(auth)} className="btn-icon" style={{ color: '#EF4444', background: '#FEF2F2' }}>
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <div className="main-content" style={{ padding: '1.5rem' }}>
                {view === 'flow' ? (
                    <UnifiedOperationFlow currentUser={currentUser} />
                ) : (
                    <AgentDashboardView currentUser={currentUser} />
                )}
            </div>
        </div>
    );
}

function AgentDashboardView({ currentUser }) {
    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        if (!currentUser?.hospital || !currentUser?.gate) return;

        const q = query(
            collection(db, "active_parking"),
            where("hospital", "==", currentUser.hospital),
            where("gate", "==", currentUser.gate),
            where("status", "==", "occupied")
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return unsubscribe;
    }, [currentUser]);

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Vehículos en Sede</h3>
                <div className="badge badge-primary" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>{vehicles.length}</div>
            </div>

            <div className="grid-dashboard" style={{ gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                {vehicles.map(v => {
                    const entryTime = v.entryTime?.toDate();
                    const now = new Date();
                    const diffMins = entryTime ? Math.round((now - entryTime) / 60000) : 0;

                    return (
                        <div key={v.id} className="card" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'monospace', color: '#1E293B' }}>{v.plate}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{v.driverName || 'Conductor General'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="badge badge-warning" style={{ marginBottom: '0.25rem', display: 'inline-block' }}>
                                    {diffMins} min
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                                    {entryTime ? entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                            </div>
                        </div>
                    )
                })}
                {vehicles.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', border: '2px dashed #E2E8F0', borderRadius: '1rem' }}>
                        <Car size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>No hay vehículos registrados en esta puerta.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function UnifiedOperationFlow({ currentUser }) {
    const [step, setStep] = useState('scan'); // 'scan' | 'entry' | 'exit'
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
            console.log("OCR Raw:", text);

            // Strategy: Prioritize specific Peruvian plate patterns
            // pattern 1: 3 Letters + 3 Numbers (Example: ABC-123, ABC 123, ABC123)
            const matchStandard = text.match(/([a-zA-Z]{3})[\s-]*([0-9]{3})(?![0-9])/); // (?![0-9]) ensure not 4 numbers

            // pattern 2: 2 Letters + 4 Numbers (Example: AB-1234)
            const matchOld = text.match(/([a-zA-Z]{2})[\s-]*([0-9]{4})/);

            let detected = null;

            if (matchStandard) {
                detected = (matchStandard[1] + matchStandard[2]).toUpperCase();
            } else if (matchOld) {
                detected = (matchOld[1] + matchOld[2]).toUpperCase();
            } else {
                // Fallback: If no clear pattern, but the TOTAL clean text is exactly 6 or 7 chars, use it.
                // This prevents "PERU ABC 123" from becoming "PERUABC123" (10 chars), but catches a clean crop "ABC123"
                const cleanAll = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                if (cleanAll.length >= 6 && cleanAll.length <= 7) {
                    detected = cleanAll;
                }
            }

            if (detected) {
                checkPlateAction(detected);
            } else {
                // Try one last heuristic: Look for lines with exactly 6-7 alphanum chars
                const lines = text.split('\n');
                const potentialLine = lines.find(l => {
                    const c = l.replace(/[^A-Za-z0-9]/g, '');
                    return c.length >= 6 && c.length <= 7;
                });

                if (potentialLine) {
                    checkPlateAction(potentialLine.replace(/[^A-Za-z0-9]/g, '').toUpperCase());
                } else {
                    alert("No se detectó patrón de placa (Ej: ABC-123). Intente acercar la cámara.");
                    setPlate('');
                }
            }

        } catch (err) {
            console.error(err);
            alert("Error al leer imagen.");
            setPlate('');
        }
        setOcrLoading(false);
    };

    const checkPlateAction = async (plateToCheck) => {
        const p = plateToCheck || plate;
        if (!p) return;
        setPlate(p.toUpperCase());
        setLoading(true);
        setMessage(null);

        try {
            const q = query(collection(db, "active_parking"), where("plate", "==", p.toUpperCase()));
            const snap = await getDocs(q);

            if (!snap.empty) {
                setParkingItem({ id: snap.docs[0].id, ...snap.docs[0].data() });
                setStep('exit');
            } else {
                setStep('entry');
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Error al verificar placa.' });
        }
        setLoading(false);
    };

    const resetFlow = () => {
        setStep('scan');
        setPlate('');
        setParkingItem(null);
        setParkingItem(null);
        setMessage(null);
    }

    // currentUser passed as prop now


    if (step === 'scan') {
        return (
            <div className="card fade-in">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#1E293B' }}>Control de Acceso</h3>
                    <p style={{ color: '#64748B' }}>Ingrese o escanee la placa para iniciar.</p>
                </div>

                <div className="input-group">
                    <label className="label">Placa del Vehículo</label>
                    <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <input
                                className="input"
                                value={plate}
                                onChange={e => setPlate(e.target.value.toUpperCase())}
                                placeholder="ABC-123"
                                style={{ fontSize: '2rem', letterSpacing: '4px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', height: '70px' }}
                                onKeyDown={e => e.key === 'Enter' && checkPlateAction()}
                            />
                            <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                                <input type="file" accept="image/*" capture="environment"
                                    onChange={handleOCR}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 2 }}
                                />
                                <button className="btn btn-primary btn-icon" type="button" style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}>
                                    {ocrLoading ? <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span> : <Camera size={28} />}
                                </button>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => checkPlateAction()}
                            disabled={loading || !plate}
                            style={{ padding: '1rem', fontSize: '1.1rem', fontWeight: 600 }}
                        >
                            {loading ? 'Verificando...' : 'CONTINUAR'}
                        </button>
                    </div>
                </div>
                {message && <div className="badge badge-danger" style={{ display: 'flex', justifyContent: 'center' }}>{message.text}</div>}
            </div>
        );
    }

    return (
        <>
            <button onClick={resetFlow} style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <ArrowLeft size={18} /> Volver / Nueva Consulta
            </button>

            {step === 'entry' && <EntryForm plateProp={plate} onSuccess={resetFlow} currentUser={currentUser} />}

            {step === 'exit' && (
                <ExitView
                    parkingItem={parkingItem}
                    onSuccess={resetFlow}
                    onSwitchToEntry={() => setStep('entry')}
                />
            )}
        </>
    );
}

function EntryForm({ plateProp, onSuccess, currentUser }) {
    const [mode, setMode] = useState('personal');
    // plateProp comes from parent. We treat it as fixed for this transaction context.
    const [plate] = useState(plateProp);

    const [loading, setLoading] = useState(false);
    const [successView, setSuccessView] = useState(false); // New success state
    const [message, setMessage] = useState(null);
    const [foundPerson, setFoundPerson] = useState(null);
    const [driverName, setDriverName] = useState('');
    const [vehicleType, setVehicleType] = useState('auto');

    // Directory Search States
    const [showDirectorySearch, setShowDirectorySearch] = useState(false);
    const [directoryQuery, setDirectoryQuery] = useState('');
    const [directoryResult, setDirectoryResult] = useState(null);

    // Initial search when component mounts or mode switches (if personal)
    useEffect(() => {
        if (mode === 'personal' && plate) handleSearchPersonal();
    }, [mode, plate]);

    const handleSearchPersonal = async () => {
        setLoading(true);
        setFoundPerson(null);
        setMessage(null);
        setDirectoryResult(null);
        setShowDirectorySearch(false);

        try {
            const q = query(collection(db, "personnel"), where("licensePlate", "==", plate.toUpperCase().trim()));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                setFoundPerson({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
            } else {
                // If not found in personal registry, prompt directory search
                setMessage({ type: 'warning', text: 'Vehículo NO registrado.' });
                setShowDirectorySearch(true);
            }
        } catch (err) { setMessage({ type: 'error', text: 'Error al buscar.' }); }
        setLoading(false);
    };

    const [directoryResultsList, setDirectoryResultsList] = useState([]); // List of multiple matches

    const searchInDirectory = async () => {
        if (!directoryQuery || directoryQuery.length < 3) return; // Min 3 chars
        setLoading(true);
        setDirectoryResultsList([]);
        setMessage(null);
        setDirectoryResult(null);

        try {
            let results = [];
            const term = directoryQuery.trim().toLowerCase();

            // 1. Exact DNI Search
            if (/^\d+$/.test(term)) {
                const qDni = query(collection(db, "staff_directory"), where("dni", "==", term));
                const snapDni = await getDocs(qDni);
                snapDni.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
            }

            // 2. Name/Lastname Search (Manual Filter because Firestore doesn't support 'contains')
            if (results.length === 0) {
                // We fetch all (or a reasonable limit could be better, but for now fetch all is safer for small directories)
                // Optimally we should maybe structure data to allow improved searching, but client-side filter is fine for < 1000 records
                const qAll = query(collection(db, "staff_directory"));
                const snapAll = await getDocs(qAll);

                results = snapAll.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(person => {
                        const fullName = (person.fullName || "").toLowerCase();
                        // Check if term is part of full name
                        return fullName.includes(term);
                    });
            }

            if (results.length > 0) {
                setDirectoryResultsList(results);
                if (results.length === 1) {
                    // Auto-select if only one
                    selectDirectoryPerson(results[0]);
                }
            } else {
                setMessage({ type: 'error', text: 'No se encontraron coincidencias.' });
            }

        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: 'Error en búsqueda.' });
        }
        setLoading(false);
    }

    const selectDirectoryPerson = (person) => {
        setDirectoryResult(person);
        setDirectoryResultsList([]); // Clear list
        setDirectoryQuery(''); // Clear query
    }

    const registerEntry = async () => {
        setLoading(true);
        try {
            const entryData = {
                plate: plate.toUpperCase(),
                type: mode,
                entryTime: serverTimestamp(),
                status: 'occupied',
                dateString: new Date().toLocaleDateString('es-PE'),
                // Enhanced tracking data
                hospital: currentUser?.hospital || 'Principal',
                gate: currentUser?.gate || 'Principal',
                agentName: currentUser?.fullName || currentUser?.username || 'Agente',
                agentId: auth.currentUser?.uid
            };

            if (mode === 'personal') {
                if (foundPerson) {
                    entryData.driverName = foundPerson.fullName || `${foundPerson.firstName} ${foundPerson.lastName}`;
                    entryData.vehicleType = foundPerson.vehicleType || 'auto';
                    entryData.personnelId = foundPerson.id;
                } else if (directoryResult) {
                    // NEW: Automatically register this relationship for future automatic detection
                    const newPersonnelData = {
                        licensePlate: plate.toUpperCase(),
                        fullName: directoryResult.fullName,
                        firstName: directoryResult.fullName.split(' ')[0], // Approximate first name
                        lastName: directoryResult.fullName.split(' ').slice(1).join(' '), // Approximate last name
                        role: directoryResult.role,
                        dni: directoryResult.dni || '',
                        vehicleType: vehicleType,
                        createdAt: serverTimestamp()
                    };

                    try {
                        const personRef = await addDoc(collection(db, "personnel"), newPersonnelData);
                        entryData.personnelId = personRef.id;
                    } catch (saveErr) {
                        console.error("Error saving automatic personnel link:", saveErr);
                        // Continue anyway, just logging the error
                    }

                    entryData.driverName = directoryResult.fullName;
                    entryData.vehicleType = vehicleType;
                }
            } else {
                entryData.driverName = driverName;
                entryData.vehicleType = vehicleType;
            }

            await addDoc(collection(db, "active_parking"), entryData);

            // Show success view instead of alert
            setSuccessView(true);
            setTimeout(() => {
                onSuccess();
            }, 2500);

        } catch (err) { setMessage({ type: 'error', text: 'Error al registrar.' }); }
        setLoading(false);
    };

    const handleForceExit = async () => {
        const confirm = window.confirm("¿Está seguro? Se reportará como una incidencia 'SALIDA SIN INGRESO PREVIO'.");
        if (!confirm) return;

        setLoading(true);
        try {
            // Log anomaly
            await addDoc(collection(db, "anomalies"), {
                plate,
                type: "EXIT_WITHOUT_ENTRY",
                timestamp: serverTimestamp(),
                description: "El agente forzó una SALIDA para un vehículo que no figuraba en planta."
            });

            // Register dummy history record
            await addDoc(collection(db, "history"), {
                plate: plate.toUpperCase(),
                driverName: 'NO REGISTRADO (INCIDENCIA)',
                vehicleType: 'unknown',
                entryTime: null,
                exitTime: serverTimestamp(),
                status: 'completed_anomaly',
                notes: 'Salida forzada sin registro de entrada'
            });

            setSuccessView(true);
            setTimeout(() => onSuccess(), 2500);
        } catch (err) {
            console.error(err);
            alert("Error al reportar incidencia.");
        }
        setLoading(false);
    }

    if (successView) {
        return (
            <div className="card fade-in" style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#DCFCE7', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                    <CheckCircle size={64} color="#16A34A" />
                </div>
                <h2 style={{ color: '#166534', fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800 }}>¡INGRESO REGISTRADO!</h2>
                <div style={{ fontSize: '1.25rem', color: '#15803D', fontWeight: 600, background: '#F0FDF4', padding: '0.5rem 1.5rem', borderRadius: '1rem' }}>
                    {plate}
                </div>
                <p style={{ marginTop: '2rem', color: '#86EFAC', fontSize: '0.85rem' }}>Regresando al inicio...</p>
            </div>
        );
    }

    return (
        <div className="card fade-in">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', background: '#EFF6FF', padding: '1.5rem', borderRadius: '1rem', border: '2px solid #3B82F6', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1D4ED8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>REGISTRANDO INGRESO PARA</p>
                <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#1E3A8A', letterSpacing: '4px' }}>{plate}</h2>
            </div>

            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <button
                    onClick={handleForceExit}
                    className="btn-text"
                    style={{ color: '#EF4444', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                    <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    ¿El vehículo va a SALIR? (Reportar Incidencia)
                </button>
            </div>

            <div style={{ background: '#F1F5F9', padding: '0.5rem', borderRadius: '0.75rem', display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button onClick={() => setMode('personal')} style={{
                    flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', fontWeight: '600',
                    background: mode === 'personal' ? 'white' : 'transparent',
                    color: mode === 'personal' ? '#2563EB' : '#64748B',
                    boxShadow: mode === 'personal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s'
                }}>Personal</button>
                <button onClick={() => setMode('libre')} style={{
                    flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', fontWeight: '600',
                    background: mode === 'libre' ? 'white' : 'transparent',
                    color: mode === 'libre' ? '#2563EB' : '#64748B',
                    boxShadow: mode === 'libre' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s'
                }}>Libre</button>
            </div>

            {mode === 'personal' && (
                <div className="fade-in">
                    {loading && !foundPerson && !message && <p style={{ textAlign: 'center', color: '#64748B' }}>Verificando...</p>}

                    {message && <div className={`badge badge-${message.type === 'error' ? 'danger' : 'warning'}`} style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}>{message.text}</div>}

                    {foundPerson && (
                        <div style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#fff', borderRadius: '50%', padding: '0.5rem' }}><CheckCircle color="#10B981" /></div>
                            <div>
                                <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#064E3B' }}>{foundPerson.fullName || `${foundPerson.firstName} ${foundPerson.lastName}`}</p>
                                <p style={{ color: '#047857' }}>{foundPerson.role}</p>
                            </div>
                        </div>
                    )}


                    {showDirectorySearch && !foundPerson && !directoryResult && (
                        <div style={{ background: '#FFF7ED', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #FFEDD5', marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '0.9rem', color: '#9A3412', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Search size={14} /> Buscar Personal (DNI o Apellido):</p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: directoryResultsList.length > 0 ? '1rem' : 0 }}>
                                <input
                                    className="input"
                                    placeholder="Ingrese DNI o Apellidos..."
                                    value={directoryQuery}
                                    onChange={e => setDirectoryQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && searchInDirectory()}
                                />
                                <button className="btn btn-primary" onClick={searchInDirectory} disabled={loading}>Buscar</button>
                            </div>

                            {/* Results List */}
                            {directoryResultsList.length > 0 && (
                                <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'white', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                                    {directoryResultsList.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => selectDirectoryPerson(item)}
                                            style={{
                                                padding: '0.75rem', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.2s',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '0.9rem' }}>{item.fullName}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{item.dni} - {item.role}</div>
                                            </div>
                                            <div style={{ color: '#2563EB', fontWeight: 'bold' }}>Seleccionar</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {directoryResult && (
                        <div className="fade-in">
                            <div style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1rem', border: '1px solid #A7F3D0' }}>
                                <p style={{ fontWeight: 'bold', color: '#064E3B' }}>{directoryResult.fullName}</p>
                                <p style={{ fontSize: '0.85rem', color: '#047857' }}>{directoryResult.role} (DNI: {directoryResult.dni})</p>
                            </div>
                            <div className="input-group">
                                <label className="label">Vehículo Nuevo</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div onClick={() => setVehicleType('auto')} style={{
                                        padding: '0.75rem', border: `2px solid ${vehicleType === 'auto' ? '#2563EB' : '#E2E8F0'}`,
                                        borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        background: vehicleType === 'auto' ? '#EFF6FF' : 'white', cursor: 'pointer'
                                    }}>
                                        <Car size={20} /> <span style={{ fontWeight: 600 }}>Auto</span>
                                    </div>
                                    <div onClick={() => setVehicleType('moto')} style={{
                                        padding: '0.75rem', border: `2px solid ${vehicleType === 'moto' ? '#2563EB' : '#E2E8F0'}`,
                                        borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        background: vehicleType === 'moto' ? '#EFF6FF' : 'white', cursor: 'pointer'
                                    }}>
                                        <Bike size={20} /> <span style={{ fontWeight: 600 }}>Moto</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode === 'libre' && (
                <div className="fade-in">
                    <div className="input-group">
                        <label className="label">Nombre del Conductor</label>
                        <input className="input" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Ej: Visitante" />
                    </div>
                    <div className="input-group">
                        <label className="label">Tipo de Vehículo</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div onClick={() => setVehicleType('auto')} style={{
                                padding: '1rem', border: `2px solid ${vehicleType === 'auto' ? '#2563EB' : '#E2E8F0'}`,
                                borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                background: vehicleType === 'auto' ? '#EFF6FF' : 'white', color: vehicleType === 'auto' ? '#2563EB' : '#64748B'
                            }}>
                                <Car size={24} /> <span style={{ fontWeight: 600 }}>Auto</span>
                            </div>
                            <div onClick={() => setVehicleType('moto')} style={{
                                padding: '1rem', border: `2px solid ${vehicleType === 'moto' ? '#2563EB' : '#E2E8F0'}`,
                                borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                background: vehicleType === 'moto' ? '#EFF6FF' : 'white', color: vehicleType === 'moto' ? '#2563EB' : '#64748B'
                            }}>
                                <Bike size={24} /> <span style={{ fontWeight: 600 }}>Moto</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem', padding: '1.25rem', fontSize: '1.1rem', background: '#22C55E', boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.39)' }}
                disabled={loading || (mode === 'personal' && !foundPerson && !directoryResult && !showDirectorySearch && !driverName && mode === 'libre' && false)}
                onClick={registerEntry}
            >
                {loading ? 'Procesando...' : 'CONFIRMAR INGRESO'}
            </button>
        </div>
    );
}

function ExitView({ parkingItem, onSuccess, onSwitchToEntry }) {
    const [loading, setLoading] = useState(false);
    const [successView, setSuccessView] = useState(false); // New success state

    const processExit = async () => {
        setLoading(true);
        try {
            await addDoc(collection(db, "history"), { ...parkingItem, exitTime: serverTimestamp(), status: 'completed' });
            await deleteDoc(doc(db, "active_parking", parkingItem.id));

            setSuccessView(true);
            setTimeout(() => {
                onSuccess();
            }, 2500);

        } catch (err) { alert('Error.'); setLoading(false); }
    };

    const handleForceEntry = async () => {
        const confirm = window.confirm("¿Está seguro? Esto cerrará la sesión anterior del vehículo y le permitirá registrar un nuevo ingreso. Se guardará como incidencia.");
        if (!confirm) return;

        setLoading(true);
        try {
            // Log anomaly
            await addDoc(collection(db, "anomalies"), {
                plate: parkingItem.plate,
                type: "ENTRY_WHILE_RECORDED_INSIDE",
                timestamp: serverTimestamp(),
                description: `Intento de ingreso de ${parkingItem.plate} que ya figuraba dentro. Se cerró la sesión anterior forzosamente.`
            });

            // Close previous session artificially
            await addDoc(collection(db, "history"), {
                ...parkingItem,
                exitTime: serverTimestamp(),
                status: 'completed_forced',
                notes: 'Cierre forzado al intentar re-ingresar'
            });
            await deleteDoc(doc(db, "active_parking", parkingItem.id));

            // Switch to entry mode
            onSwitchToEntry();

        } catch (err) {
            console.error(err);
            alert("Error al procesar incidencia.");
            setLoading(false);
        }
    }

    if (successView) {
        return (
            <div className="card fade-in" style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#EFF6FF', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                    <CheckCircle size={64} color="#2563EB" />
                </div>
                <h2 style={{ color: '#1E40AF', fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800 }}>¡SALIDA REGISTRADA!</h2>
                <div style={{ fontSize: '1.25rem', color: '#1D4ED8', fontWeight: 600, background: '#EFF6FF', padding: '0.5rem 1.5rem', borderRadius: '1rem' }}>
                    {parkingItem.plate}
                </div>
                <p style={{ marginTop: '2rem', color: '#93C5FD', fontSize: '0.85rem' }}>Buen viaje...</p>
            </div>
        );
    }

    return (
        <div className="card fade-in">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', background: '#F0FDF4', padding: '1.5rem', borderRadius: '1rem', border: '2px solid #22C55E', boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.1)' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#15803D', marginBottom: '0.5rem', textTransform: 'uppercase' }}>CONFIRMAR SALIDA DE</p>
                <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#14532D', letterSpacing: '4px' }}>{parkingItem.plate}</h2>
                <span className="badge badge-primary" style={{ marginTop: '0.5rem', background: '#BBF7D0', color: '#14532D', border: '1px solid #4ADE80' }}>{parkingItem.vehicleType}</span>
            </div>

            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.25rem', color: '#0F172A', fontWeight: 600 }}>{parkingItem.driverName}</p>
                <div style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '0.5rem' }}>
                    Hora de Ingreso: {parkingItem.entryTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <button
                    onClick={handleForceEntry}
                    className="btn-text"
                    style={{ color: '#F59E0B', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                    <ArrowRightLeft size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    ¿Va a ENTRAR? (Corregir Incidencia)
                </button>
            </div>

            <button
                className="btn btn-danger"
                style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)' }}
                onClick={processExit}
                disabled={loading}
            >
                {loading ? 'Procesando...' : 'REGISTRAR SALIDA'}
            </button>
        </div>
    );
}
