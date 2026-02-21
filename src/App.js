import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, LogOut, Users, Upload, Calendar, MapPin, Phone, Mail, Home, History, Info, Users as UsersIcon } from 'lucide-react';
import './App.css';

// TUKAR URL NI
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQXq-tTufBZ1kwwYYd85DTmR2KQ1KK-gZI3e65c24rVMJ54IlE4cbY6DOJVG2tvSQo/exec';

function App() {
  const [view, setView] = useState('login'); // 'login', 'register', 'adminLogin', 'dashboard'
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form States
  const [loginData, setLoginData] = useState({ ic: '', password: '' });
  const [registerData, setRegisterData] = useState({ ic: '', password: '', name: '', email: '', jabatan: '' });
  const [bookingFilter, setBookingFilter] = useState({ start_date: '', end_date: '', start_time: '', end_time: '' });

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

  useEffect(() => { fetchData(); }, []);

  const handleLogin = async (e, type) => {
    e.preventDefault();
    setLoading(true);
    const usersData = await sheetCall('GET', 'users');
    const foundUser = usersData.find(u => String(u.ic) === String(loginData.ic) && String(u.password) === String(loginData.password));
    
    if (foundUser) {
      if (type === 'admin' && foundUser.role !== 'admin') {
        alert("Akses Ditolak: Anda bukan Admin!");
      } else {
        setUser(foundUser);
        setView('dashboard');
        setActiveTab(foundUser.role === 'admin' ? 'manageBookings' : 'profile');
      }
    } else {
      alert("No IC atau Password salah!");
    }
    setLoading(false);
  };

  // --- RENDERING LAMAN LOGIN (IMAGE 1) ---
  if (view === 'login' || view === 'register' || view === 'adminLogin') {
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

  // --- RENDERING DASHBOARD (IMAGE 2) ---
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
              <button onClick={() => setActiveTab('manageBookings')} className={activeTab === 'manageBookings' ? 'active' : ''}><Calendar size={18}/> Kelulusan</button>
              <button onClick={() => setActiveTab('manageRooms')} className={activeTab === 'manageRooms' ? 'active' : ''}><Home size={18}/> Urus Bilik</button>
              <button onClick={() => setActiveTab('manageUsers')} className={activeTab === 'manageUsers' ? 'active' : ''}><UsersIcon size={18}/> Urus User</button>
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
            <h2>Maklumat Peribadi</h2>
            <div className="profile-info">
              <p><strong>Nama:</strong> {user?.name}</p>
              <p><strong>No IC:</strong> {user?.ic}</p>
              <p><strong>Jabatan:</strong> {user?.jabatan}</p>
              <p><strong>Emel:</strong> {user?.email}</p>
            </div>
          </div>
        )}
        
        {/* Tambah Tab Lain Di Sini */}
        <div className="placeholder-content">
            <p>Paparan untuk <strong>{activeTab}</strong> sedang dibina...</p>
        </div>
      </main>
    </div>
  );
}

export default App;