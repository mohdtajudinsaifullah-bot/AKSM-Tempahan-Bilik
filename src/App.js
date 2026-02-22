import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, LogOut, Users, Calendar, Home, History, Info, List, MapPin, Phone, Mail, Loader2 } from 'lucide-react';
import './App.css';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzkXpSRT1YqBE6V4iqKjRN-VDf8XVoNqXh9Tl-OQL0WdBiQ5h2x6t6YZQFDyiRj1n3X/exec';

function App() {
  const [view, setView] = useState('login'); // 'login', 'register', 'adminLogin', 'dashboard'
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // Form States
  const [loginData, setLoginData] = useState({ ic: '', password: '' });
  const [registerData, setRegisterData] = useState({ ic: '', password: '', name: '', email: '', jabatan: '' });
  const [bookingFilter, setBookingFilter] = useState({ start_date: '', end_date: '' });

  // Fungsi Panggil Google Sheet
  const sheetCall = async (method, table, data = null, idField = '', idValue = '') => {
    try {
      if (method === 'GET') {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?table=${table}`);
        return await response.json();
      } else {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method, table, data, idField, idValue })
        });
        return { success: true };
      }
    } catch (error) { return null; }
  };

  const fetchData = async () => {
    setLoading(true);
    const r = await sheetCall('GET', 'rooms');
    const b = await sheetCall('GET', 'bookings');
    const u = await sheetCall('GET', 'users');
    if (r) setRooms(r);
    if (b) setBookings(b);
    if (u) setUsers(u);
    setLoading(false);
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleLogin = async (e, type) => {
    e.preventDefault();
    setLoading(true);
    
    // Kita fetch sekali lagi untuk pastikan data paling latest
    const latestUsers = await sheetCall('GET', 'users');
    const foundUser = latestUsers?.find(u => String(u.ic) === String(loginData.ic) && String(u.password) === String(loginData.password));
    
    if (foundUser) {
      if (type === 'admin' && foundUser.role !== 'admin') {
        alert("Akses Ditolak: Anda bukan Admin!");
      } else {
        setUser(foundUser);
        setView('dashboard');
        setActiveTab(foundUser.role === 'admin' ? 'tindakan' : 'profile');
      }
    } else {
      alert("No IC atau Password salah!");
    }
    setLoading(false);
  };

  const handleDateChange = (field, value) => {
    const newFilters = { ...bookingFilter, [field]: value };
    if (newFilters.start_date && newFilters.end_date) {
      if (newFilters.start_date > newFilters.end_date) {
        alert("Ops! Tarikh mula tidak boleh melebihi tarikh tamat.");
        return;
      }
    }
    setBookingFilter(newFilters);
  };

  const filteredRooms = rooms.filter(room => {
    if (!bookingFilter.start_date) return true;
    const isOccupied = bookings.some(b => 
      b.room_id === room.id && b.status === 'approved' && 
      (bookingFilter.start_date <= b.end_date && (bookingFilter.end_date || bookingFilter.start_date) >= b.start_date)
    );
    return !isOccupied;
  });

  // --- RENDERING LAMAN LOGIN (IMAGE 1 STYLE) ---
  if (view !== 'dashboard') {
    return (
      <div className="login-container">
        <div className="login-left">
          <div className="overlay">
            <h1>Sistem Tempahan Bilik AKSM</h1>
            <p className="subtitle">Akademi Kehakiman Syariah Malaysia</p>
            <div className="contact-info">
              <p><MapPin size={18} /> Tingkat 6, Menara PJH, Putrajaya</p>
              <p><Phone size={18} /> 0123456789</p>
              <p><Mail size={18} /> aksm@esyariah.gov.my</p>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="form-card">
            {view === 'login' && (
              <>
                <h2>Selamat Datang</h2>
                <form onSubmit={(e) => handleLogin(e, 'user')}>
                  <input type="text" placeholder="No IC" onChange={e => setLoginData({...loginData, ic: e.target.value})} required />
                  <input type="password" placeholder="Password" onChange={e => setLoginData({...loginData, password: e.target.value})} required />
                  <button type="submit" className="btn-user" disabled={loading}>{loading ? 'Menyemak...' : 'Login User'}</button>
                </form>
                <div className="extra-links">
                    <button onClick={() => setView('adminLogin')}>Login Admin</button>
                    <button onClick={() => setView('register')}>Daftar Baru</button>
                </div>
              </>
            )}

            {view === 'adminLogin' && (
               <>
               <h2>Login Admin</h2>
               <form onSubmit={(e) => handleLogin(e, 'admin')}>
                 <input type="text" placeholder="IC Admin" onChange={e => setLoginData({...loginData, ic: e.target.value})} required />
                 <input type="password" placeholder="Password" onChange={e => setLoginData({...loginData, password: e.target.value})} required />
                 <button type="submit" className="btn-admin" disabled={loading}>{loading ? 'Menyemak...' : 'Login Sebagai Admin'}</button>
               </form>
               <button onClick={() => setView('login')} className="btn-back">Kembali</button>
             </>
            )}

            {view === 'register' && (
              <>
                <h2>Pendaftaran User</h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  await sheetCall('POST', 'users', {...registerData, role: 'user'});
                  alert("Berjaya! Sila Login.");
                  setView('login');
                  fetchData();
                }}>
                  <input type="text" placeholder="No IC" onChange={e => setRegisterData({...registerData, ic: e.target.value})} required />
                  <input type="text" placeholder="Nama" onChange={e => setRegisterData({...registerData, name: e.target.value})} required />
                  <input type="email" placeholder="Emel" onChange={e => setRegisterData({...registerData, email: e.target.value})} required />
                  <input type="password" placeholder="Password" onChange={e => setRegisterData({...registerData, password: e.target.value})} required />
                  <button type="submit" className="btn-register">Daftar Sekarang</button>
                </form>
                <button onClick={() => setView('login')} className="btn-back">Kembali</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING DASHBOARD ---
  return (
    <div className="app-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>AKSM</h3>
          <p>{user?.name}</p>
        </div>
        <nav className="menu">
          {user?.role === 'admin' ? (
            <>
              <button onClick={() => setActiveTab('tindakan')} className={activeTab === 'tindakan' ? 'active' : ''}><Check size={18}/> Tindakan</button>
              <button onClick={() => setActiveTab('senarai')} className={activeTab === 'senarai' ? 'active' : ''}><List size={18}/> Senarai Tempahan</button>
              <button onClick={() => setActiveTab('manageRooms')} className={activeTab === 'manageRooms' ? 'active' : ''}><Home size={18}/> Urus Bilik</button>
            </>
          ) : (
            <>
              <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'active' : ''}><Info size={18}/> Profil</button>
              <button onClick={() => setActiveTab('book')} className={activeTab === 'book' ? 'active' : ''}><Plus size={18}/> Tempah Bilik</button>
              <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}><History size={18}/> Sejarah</button>
            </>
          )}
          <button onClick={() => {setView('login'); setUser(null);}} className="logout-btn"><LogOut size={18}/> Keluar</button>
        </nav>
      </aside>

      <main className="content">
        {activeTab === 'profile' && (
          <div className="card-pro">
            <h2><Info /> Maklumat Peribadi</h2>
            <div className="profile-info">
              <p><strong>Nama:</strong> {user?.name}</p>
              <p><strong>No IC:</strong> {user?.ic}</p>
              <p><strong>Emel:</strong> {user?.email}</p>
            </div>
          </div>
        )}

        {activeTab === 'book' && (
          <div className="booking-section">
            <div className="card-pro" style={{marginBottom: '20px'}}>
              <h3>Pilih Tarikh Tempahan</h3>
              <div className="filter-row" style={{display: 'flex', gap: '15px', marginTop: '10px'}}>
                <input type="date" className="pro-input" value={bookingFilter.start_date} onChange={e => handleDateChange('start_date', e.target.value)} />
                <input type="date" className="pro-input" value={bookingFilter.end_date} onChange={e => handleDateChange('end_date', e.target.value)} />
              </div>
            </div>

            <div className="rooms-grid">
              {filteredRooms.map(room => (
                <div key={room.id} className="room-card-v2">
                  <div className="room-badge">{room.capacity} Orang</div>
                  <img src={JSON.parse(room.images || '[""]') [0] || 'https://placehold.co/600x400?text=Bilik'} alt="room" />
                  <div className="room-info" style={{padding: '15px'}}>
                    <h4>{room.name}</h4>
                    <button 
                      className="btn-user" 
                      style={{marginTop: '10px'}}
                      disabled={isSubmitting || !bookingFilter.start_date}
                      onClick={async () => {
                        setIsSubmitting(true);
                        const newB = {
                          id: Date.now().toString(),
                          room_id: room.id,
                          room_name: room.name,
                          user_ic: user.ic,
                          user_name: user.name,
                          start_date: bookingFilter.start_date,
                          end_date: bookingFilter.end_date || bookingFilter.start_date,
                          status: 'approved'
                        };
                        await sheetCall('POST', 'bookings', newB);
                        alert("Tempahan Berjaya!");
                        await fetchData();
                        setIsSubmitting(false);
                        setActiveTab('history');
                      }}
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Tempah Sekarang'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card-pro">
            <h2><History /> Sejarah Tempahan</h2>
            <table className="pro-table">
              <thead><tr><th>Bilik</th><th>Tarikh</th><th>Status</th></tr></thead>
              <tbody>
                {bookings?.filter(b => String(b.user_ic) === String(user.ic)).map(b => (
                  <tr key={b.id}>
                    <td>{b.room_name}</td><td>{b.start_date}</td>
                    <td><span className={`badge ${b.status}`}>{b.status?.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'manageRooms' && (
          <div className="card-pro">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
              <h2><Home /> Urus Bilik</h2>
              <button className="btn-user" style={{width:'auto', padding:'10px'}} onClick={() => setEditingRoom({ name: '', capacity: '', images: '[]', isNew: true })}>+ Tambah Bilik</button>
            </div>
            <table className="pro-table">
              <thead><tr><th>Nama Bilik</th><th>Kapasiti</th><th>Aksi</th></tr></thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td>{r.name}</td><td>{r.capacity} Orang</td>
                    <td>
                      <button onClick={() => setEditingRoom(r)} style={{marginRight: '10px'}}><Edit2 size={16} /></button>
                      <button onClick={() => { if(window.confirm("Hapus?")) sheetCall('DELETE', 'rooms', null, 'id', r.id).then(()=>fetchData()) }}><Trash2 size={16} color="red" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL EDIT BILIK */}
        {editingRoom && (
          <div className="modal-overlay">
            <div className="modal-content card-pro">
              <h3>{editingRoom.isNew ? 'Tambah Bilik' : 'Kemaskini Bilik'}</h3>
              <input type="text" placeholder="Nama Bilik" value={editingRoom.name} onChange={e => setEditingRoom({...editingRoom, name: e.target.value})} className="pro-input" />
              <input type="number" placeholder="Kapasiti" value={editingRoom.capacity} onChange={e => setEditingRoom({...editingRoom, capacity: e.target.value})} className="pro-input" />
              <p style={{fontSize: '0.8rem', marginTop: '10px'}}>Upload Gambar (Boleh pilih banyak):</p>
              <input type="file" multiple onChange={async (e) => {
                 const files = Array.from(e.target.files);
                 const base64s = await Promise.all(files.map(file => new Promise(resolve => {
                   const reader = new FileReader();
                   reader.onload = (ev) => resolve(ev.target.result);
                   reader.readAsDataURL(file);
                 })));
                 setEditingRoom({...editingRoom, newImages: base64s});
              }} />
              <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                <button className="btn-user" onClick={async () => {
                  setLoading(true);
                  const dataToSend = {
                    ...editingRoom,
                    images: JSON.stringify(editingRoom.newImages || JSON.parse(editingRoom.images || '[]')),
                    id: editingRoom.id || Date.now().toString()
                  };
                  delete dataToSend.newImages; delete dataToSend.isNew;
                  await sheetCall(editingRoom.isNew ? 'POST' : 'PATCH', 'rooms', dataToSend, 'id', editingRoom.id);
                  setEditingRoom(null); fetchData(); setLoading(false);
                }}>Simpan</button>
                <button className="btn-back" onClick={() => setEditingRoom(null)}>Batal</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;