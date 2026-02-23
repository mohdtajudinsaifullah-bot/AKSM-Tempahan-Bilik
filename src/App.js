import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, LogOut, Users, Calendar, Home, History, Info, List, MapPin, Phone, Mail, Loader2, Building } from 'lucide-react';
import './App.css';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzkXpSRT1YqBE6V4iqKjRN-VDf8XVoNqXh9Tl-OQL0WdBiQ5h2x6t6YZQFDyiRj1n3X/exec';

function App() {
  const [view, setView] = useState('login'); 
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const [loginData, setLoginData] = useState({ ic: '', password: '' });
  const [registerData, setRegisterData] = useState({ ic: '', password: '', name: '', email: '', jabatan: '' });
  const [bookingFilter, setBookingFilter] = useState({ start_date: '', end_date: '' });

  const sheetCall = async (method, table, data = null, idField = '', idValue = '') => {
    try {
      if (method === 'GET') {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?table=${table}`);
        const result = await response.json();
        return result;
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
    setRooms(r || []);
    setBookings(b || []);
    setUsers(u || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogin = async (e, type) => {
    e.preventDefault();
    setLoading(true);
    const latestUsers = await sheetCall('GET', 'users');
    const foundUser = latestUsers?.find(u => String(u.ic) === String(loginData.ic) && String(u.password) === String(loginData.password));
    
    if (foundUser) {
      if (type === 'admin' && foundUser.role !== 'admin') {
        alert("Akses Ditolak!");
      } else {
        setUser(foundUser);
        setView('dashboard');
        setActiveTab(foundUser.role === 'admin' ? 'tindakan' : 'profile');
      }
    } else {
      alert("IC atau Password salah!");
    }
    setLoading(false);
  };

  // --- LOGIK FILTER TINDAKAN (BELUM MELEPASI HARI INI) ---
  const today = new Date().toISOString().split('T')[0];
  const activeBookings = bookings.filter(b => b.start_date >= today);

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
                  <button type="submit" className="btn-user" disabled={loading}>{loading ? 'Sila Tunggu...' : 'Login User'}</button>
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
                 <button type="submit" className="btn-admin">Login Admin</button>
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
                  alert("Berjaya Daftar!");
                  setView('login');
                  fetchData();
                }}>
                  <input type="text" placeholder="No IC" onChange={e => setRegisterData({...registerData, ic: e.target.value})} required />
                  <input type="text" placeholder="Nama Penuh" onChange={e => setRegisterData({...registerData, name: e.target.value})} required />
                  <input type="text" placeholder="Jabatan" onChange={e => setRegisterData({...registerData, jabatan: e.target.value})} required />
                  <input type="email" placeholder="Emel (Untuk Notifikasi)" onChange={e => setRegisterData({...registerData, email: e.target.value})} required />
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

  return (
    <div className="app-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header"><h3>AKSM</h3><p>{user?.name}</p></div>
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
        {/* PROFILE USER - DAH ADA JABATAN */}
        {activeTab === 'profile' && (
          <div className="card-pro">
            <h2><Info /> Profil Saya</h2>
            <div className="profile-info" style={{lineHeight:'2'}}>
              <p><strong>Nama:</strong> {user?.name}</p>
              <p><strong>Jabatan:</strong> {user?.jabatan || 'Tiada Maklumat'}</p>
              <p><strong>No IC:</strong> {user?.ic}</p>
              <p><strong>Emel:</strong> {user?.email}</p>
            </div>
          </div>
        )}

        {/* TAB TINDAKAN (ADMIN) - FILTER TARIKH AKAN DATANG */}
        {activeTab === 'tindakan' && (
          <div className="card-pro">
            <h2>Tindakan Admin (Aktif)</h2>
            <table className="pro-table">
              <thead><tr><th>Bilik</th><th>Pemohon</th><th>Tarikh</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {activeBookings.length > 0 ? activeBookings.map(b => (
                  <tr key={b.id}>
                    <td>{b.room_name}</td><td>{b.user_name}</td><td>{b.start_date}</td>
                    <td><span className={`badge ${b.status}`}>{b.status}</span></td>
                    <td>
                      <button className="btn-reject" onClick={async () => {
                         if(window.confirm("Batal tempahan ini?")) {
                           await sheetCall('PATCH', 'bookings', {status: 'cancelled'}, 'id', b.id);
                           fetchData();
                         }
                      }}>Batal</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="5" style={{textAlign:'center'}}>Tiada tempahan aktif.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB SENARAI TEMPAHAN (ADMIN) - SEMUA DATA */}
        {activeTab === 'senarai' && (
          <div className="card-pro">
            <h2>Semarai Semua Tempahan</h2>
            <table className="pro-table">
              <thead><tr><th>Bilik</th><th>Pemohon</th><th>Mula</th><th>Tamat</th></tr></thead>
              <tbody>
                {bookings.length > 0 ? bookings.map(b => (
                  <tr key={b.id}>
                    <td>{b.room_name}</td><td>{b.user_name}</td><td>{b.start_date}</td><td>{b.end_date}</td>
                  </tr>
                )) : <tr><td colSpan="4" style={{textAlign:'center'}}>Tiada data.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* KEKALKAN TAB LAIN SEPERTI SEBELUM INI (Urus Bilik, Tempah, dsb) */}
        {activeTab === 'book' && (
          <div className="booking-section">
            <div className="card-pro" style={{marginBottom: '20px'}}>
              <h3>Pilih Tarikh Tempahan</h3>
              <div className="filter-row" style={{display: 'flex', gap: '15px', marginTop: '10px'}}>
                <input type="date" className="pro-input" value={bookingFilter.start_date} 
                  onChange={e => {
                    const newStart = e.target.value;
                    if (bookingFilter.end_date && newStart > bookingFilter.end_date) {
                      alert("Tarikh mula tidak boleh lebih dari tarikh tamat!");
                    } else { setBookingFilter({...bookingFilter, start_date: newStart}); }
                  }} />
                <input type="date" className="pro-input" value={bookingFilter.end_date} 
                  onChange={e => {
                    const newEnd = e.target.value;
                    if (bookingFilter.start_date && newEnd < bookingFilter.start_date) {
                      alert("Tarikh tamat tidak boleh kurang dari tarikh mula!");
                    } else { setBookingFilter({...bookingFilter, end_date: newEnd}); }
                  }} />
              </div>
            </div>
            <div className="rooms-grid">
              {rooms.filter(room => {
                if (!bookingFilter.start_date) return true;
                return !bookings.some(b => b.room_id === room.id && b.status === 'approved' && (bookingFilter.start_date <= b.end_date && (bookingFilter.end_date || bookingFilter.start_date) >= b.start_date));
              }).map(room => (
                <div key={room.id} className="room-card-v2">
                  <img src={JSON.parse(room.images || '[""]') [0] || 'https://placehold.co/600x400'} alt="bilik" />
                  <div className="p-3">
                    <h4>{room.name}</h4>
                    <button className="btn-user" disabled={isSubmitting || !bookingFilter.start_date}
                      onClick={async () => {
                        setIsSubmitting(true);
                        const newB = { id: Date.now().toString(), room_id: room.id, room_name: room.name, user_ic: user.ic, user_name: user.name, email: user.email, start_date: bookingFilter.start_date, end_date: bookingFilter.end_date || bookingFilter.start_date, status: 'approved' };
                        await sheetCall('POST', 'bookings', newB);
                        alert("Berjaya! Notifikasi auto-hantar.");
                        await fetchData(); setIsSubmitting(false); setActiveTab('history');
                      }}>Tempah Sekarang</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'manageRooms' && (
          <div className="card-pro">
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
              <h2>Urus Bilik</h2>
              <button className="btn-user" style={{width:'auto'}} onClick={() => setEditingRoom({name:'', capacity:'', images:'[]', isNew:true})}>+ Bilik</button>
            </div>
            <table className="pro-table">
              <thead><tr><th>Nama Bilik</th><th>Kapasiti</th><th>Aksi</th></tr></thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td>{r.name}</td><td>{r.capacity}</td>
                    <td>
                      <button onClick={() => setEditingRoom(r)}><Edit2 size={16}/></button>
                      <button onClick={() => {if(window.confirm("Hapus?")) sheetCall('DELETE','rooms',null,'id',r.id).then(()=>fetchData())}}><Trash2 size={16} color="red"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editingRoom && (
          <div className="modal-overlay">
            <div className="modal-content card-pro">
              <h3>{editingRoom.isNew ? 'Tambah' : 'Edit'} Bilik</h3>
              <input className="pro-input" placeholder="Nama" value={editingRoom.name} onChange={e => setEditingRoom({...editingRoom, name: e.target.value})} />
              <input className="pro-input" type="number" placeholder="Kapasiti" value={editingRoom.capacity} onChange={e => setEditingRoom({...editingRoom, capacity: e.target.value})} />
              <input type="file" multiple onChange={async (e) => {
                 const base64s = await Promise.all(Array.from(e.target.files).map(f => new Promise(res => {
                   const r = new FileReader(); r.onload = (ev) => res(ev.target.result); r.readAsDataURL(f);
                 })));
                 setEditingRoom({...editingRoom, newImages: base64s});
              }} />
              <div style={{marginTop:'15px', display:'flex', gap:'10px'}}>
                <button className="btn-user" onClick={async () => {
                  const data = {...editingRoom, images: JSON.stringify(editingRoom.newImages || JSON.parse(editingRoom.images || '[]'))};
                  delete data.newImages; delete data.isNew;
                  await sheetCall(editingRoom.isNew ? 'POST':'PATCH', 'rooms', data, 'id', editingRoom.id);
                  setEditingRoom(null); fetchData();
                }}>Simpan</button>
                <button className="btn-back" onClick={() => setEditingRoom(null)}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card-pro">
            <h2>Sejarah Tempahan Saya</h2>
            <table className="pro-table">
              <thead><tr><th>Bilik</th><th>Tarikh</th><th>Status</th></tr></thead>
              <tbody>
                {bookings.filter(b => String(b.user_ic) === String(user.ic)).map(b => (
                  <tr key={b.id}><td>{b.room_name}</td><td>{b.start_date}</td><td><span className={`badge ${b.status}`}>{b.status}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;