import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X, LogOut, Users, Calendar, Home, History, Info, List, Image as ImageIcon, MapPin, Phone, Mail } from 'lucide-react';
import './App.css';

// PENTING: Ganti dengan URL Google Script kau yang baru (selepas update doPost)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzkXpSRT1YqBE6V4iqKjRN-VDf8XVoNqXh9Tl-OQL0WdBiQ5h2x6t6YZQFDyiRj1n3X/exec';

function App() {
  const [view, setView] = useState('login'); 
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ ic: '', password: '' });
  const [registerData, setRegisterData] = useState({ ic: '', password: '', name: '', email: '', jabatan: '' });
  const [bookingFilter, setBookingFilter] = useState({ start_date: '', end_date: '' });

  const sheetCall = async (method, table, data = null, idField = '', idValue = '') => {
    try {
      if (method === 'GET') {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?table=${table}`);
        return await response.json();
      } else {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method, table, data, idField, idValue })
        });
        return { success: true };
      }
    } catch (e) { return null; }
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

  useEffect(() => { fetchData(); }, []);

  const handleLogin = async (e, type) => {
    e.preventDefault();
    setLoading(true);
    const foundUser = users?.find(u => String(u.ic) === String(loginData.ic) && String(u.password) === String(loginData.password));
    
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

  const availableRooms = rooms.filter(room => {
    if (!bookingFilter.start_date) return false;
    const isOccupied = bookings.some(b => 
      b.room_id === room.id && 
      b.status === 'approved' && 
      (bookingFilter.start_date <= b.end_date && (bookingFilter.end_date || bookingFilter.start_date) >= b.start_date)
    );
    return !isOccupied;
  });

  const handleMultipleImages = (e) => {
    const files = Array.from(e.target.files);
    return Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }));
  };

  // --- VIEW: LOGIN / REGISTER ---
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
                  <button type="submit" className="btn-user">Login User</button>
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
                 <button type="submit" className="btn-admin">Login Sebagai Admin</button>
               </form>
               <button onClick={() => setView('login')} className="btn-back">Kembali</button>
             </>
            )}
            {view === 'register' && (
              <>
                <h2>Pendaftaran User</h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
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

  // --- VIEW: DASHBOARD ---
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
              <button onClick={() => setActiveTab('manageUsers')} className={activeTab === 'manageUsers' ? 'active' : ''}><Users size={18}/> Urus User</button>
            </>
          ) : (
            <>
              <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'active' : ''}><Info size={18}/> Profil</button>
              <button onClick={() => setActiveTab('book')} className={activeTab === 'book' ? 'active' : ''}><Plus size={18}/> Tempah Bilik</button>
              <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}><History size={18}/> Sejarah</button>
            </>
          )}
          <button onClick={() => window.location.reload()} className="logout-btn"><LogOut size={18}/> Keluar</button>
        </nav>
      </aside>

      <main className="content">
        {activeTab === 'profile' && (
          <div className="card-pro">
            <h2>Maklumat Profil</h2>
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
              <h3>1. Pilih Tarikh Tempahan</h3>
              <div className="filter-row" style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                <input type="date" onChange={e => setBookingFilter({...bookingFilter, start_date: e.target.value})} />
                <input type="date" onChange={e => setBookingFilter({...bookingFilter, end_date: e.target.value})} />
              </div>
            </div>
            <div className="rooms-grid">
              {availableRooms.map(room => (
                <div key={room.id} className="room-card-v2">
                  <img src={JSON.parse(room.images || '[""]') [0] || 'https://placehold.co/600x400?text=Bilik'} alt="bilik" />
                  <div className="room-info" style={{padding: '15px'}}>
                    <h4>{room.name}</h4>
                    <button className="btn-user" onClick={async () => {
                      const newB = { id: Date.now().toString(), room_id: room.id, room_name: room.name, user_ic: user.ic, user_name: user.name, email: user.email, start_date: bookingFilter.start_date, end_date: bookingFilter.end_date || bookingFilter.start_date, status: 'approved' };
                      await sheetCall('POST', 'bookings', newB);
                      alert("Tempahan Berjaya & Auto-Lulus! Emel dihantar.");
                      fetchData(); setActiveTab('history');
                    }}>Tempah Sekarang</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card-pro">
            <h2>Sejarah Tempahan</h2>
            <table className="pro-table">
              <thead><tr><th>Bilik</th><th>Tarikh</th><th>Status</th></tr></thead>
              <tbody>
                {bookings?.filter(b => String(b.user_ic) === String(user.ic)).map(b => (
                  <tr key={b.id}><td>{b.room_name}</td><td>{b.start_date}</td><td><span className={`badge ${b.status}`}>{b.status}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tindakan' && (
          <div className="card-pro">
            <h2>Tindakan Admin</h2>
            <table className="pro-table">
              <thead><tr><th>Pemohon</th><th>Bilik</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>{b.user_name}</td><td>{b.room_name}</td>
                    <td><span className={`badge ${b.status}`}>{b.status}</span></td>
                    <td>
                      <button className="btn-reject" style={{padding: '5px 10px'}} onClick={() => sheetCall('PATCH', 'bookings', {status: 'rejected'}, 'id', b.id).then(()=>fetchData())}>Batal</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'senarai' && (
          <div className="card-pro">
            <h2>Senarai Semua Tempahan</h2>
            <table className="pro-table">
              <thead><tr><th>Bilik</th><th>Pemohon</th><th>Tarikh</th></tr></thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}><td>{b.room_name}</td><td>{b.user_name}</td><td>{b.start_date}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'manageRooms' && (
          <div className="card-pro">
            <div className="flex-header" style={{display: 'flex', justifyContent: 'space-between'}}>
              <h2>Urus Bilik</h2>
              <input type="file" multiple onChange={async (e) => {
                const imgs = await handleMultipleImages(e);
                const name = prompt("Nama Bilik Baru:");
                if(name) {
                  await sheetCall('POST', 'rooms', {id: Date.now().toString(), name, capacity: '10', images: JSON.stringify(imgs)});
                  fetchData();
                }
              }} />
            </div>
            <table className="pro-table">
              <thead><tr><th>Nama Bilik</th><th>Aksi</th></tr></thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}><td>{r.name}</td><td><Trash2 size={16} color="red" style={{cursor:'pointer'}} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'manageUsers' && (
          <div className="card-pro">
            <h2>Urus User</h2>
            <table className="pro-table">
              <thead><tr><th>Nama</th><th>IC</th><th>Role</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.ic}><td>{u.name}</td><td>{u.ic}</td><td>{u.role}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App; // INI YANG TADI TERTINGGAL BRO