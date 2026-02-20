import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, LogOut, Users, Upload, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import './App.css';

// === TUKAR URL INI DENGAN URL GOOGLE SCRIPT KAU ===
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQXq-tTufBZ1kwwYYd85DTmR2KQ1KK-gZI3e65c24rVMJ54IlE4cbY6DOJVG2tvSQo/exec';

function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form States
  const [loginData, setLoginData] = useState({ ic: '', password: '' });
  const [registerData, setRegisterData] = useState({ ic: '', password: '', name: '', email: '', jabatan: '' });
  const [bookingForm, setBookingForm] = useState({
    room_id: '', start_date: '', end_date: '', start_time: '', end_time: '', purpose: ''
  });

  // Function panggil Google Sheets
  const sheetCall = async (method, table, data = null, idField = '', idValue = '') => {
    try {
      if (method === 'GET') {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?table=${table}`);
        return await response.json();
      } else {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', // Penting untuk elak CORS error
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method, table, data, idField, idValue })
        });
        return { success: true };
      }
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    const roomsData = await sheetCall('GET', 'rooms');
    const bookingsData = await sheetCall('GET', 'bookings');
    const usersData = await sheetCall('GET', 'users');
    if (roomsData) setRooms(roomsData);
    if (bookingsData) setBookings(bookingsData);
    if (usersData) setUsers(usersData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleLogin = async (e, type) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1. Tarik data fresh dulu dari Google Sheets sebelum check login
    const usersData = await sheetCall('GET', 'users');
    if (usersData) {
      setUsers(usersData);
      
      // 2. Cari user (Kita convert IC & Password ke String untuk elak mismatch)
      const foundUser = usersData.find(u => 
        String(u.ic).trim() === String(loginData.ic).trim() && 
        String(u.password).trim() === String(loginData.password).trim()
      );

      if (foundUser) {
        // 3. Check kalau login Admin
        if (type === 'admin') {
          if (String(foundUser.role).toLowerCase() === 'admin') {
            setUser(foundUser);
            setIsAdmin(true);
            setView('adminDashboard');
          } else {
            alert("Akses Ditolak: Anda bukan Admin!");
          }
        } else {
          // 4. Login User Biasa
          setUser(foundUser);
          setIsAdmin(foundUser.role === 'admin');
          setView('userDashboard');
        }
      } else {
        alert("No IC atau Password salah! Sila cuba lagi.");
      }
    } else {
      alert("Gagal menghubungi server. Sila refresh page.");
    }
  } catch (error) {
    console.error("Login Error:", error);
    alert("Terjadi ralat semasa proses login.");
  } finally {
    setLoading(false);
  }
};

  const handleRegister = async (e) => {
    e.preventDefault();
    const newUser = { ...registerData, role: 'user' };
    await sheetCall('POST', 'users', newUser);
    alert("Pendaftaran berjaya! Sila log masuk.");
    setView('login');
    fetchData();
  };

  const handleBookRoom = async (e) => {
    e.preventDefault();
    const newBooking = {
      ...bookingForm,
      user_ic: user.ic,
      user_name: user.name,
      user_email: user.email,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    await sheetCall('POST', 'bookings', newBooking);
    alert("Tempahan dihantar untuk kelulusan!");
    setBookingForm({ room_id: '', start_date: '', end_date: '', start_time: '', end_time: '', purpose: '' });
    fetchData();
  };

  // Render Login Page
  if (view === 'login' || view === 'register' || view === 'adminLogin') {
    return (
      <div className="login-container">
        <div className="login-left">
          <div className="overlay">
            <h1>Sistem Tempahan Bilik AKSM</h1>
            <p>Akademi Kehakiman Syariah Malaysia</p>
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
                  <button type="submit" className="btn-user">Login Sebagai User</button>
                </form>
                <button onClick={() => setView('adminLogin')} className="btn-admin-link">Login Sebagai Admin</button>
                <button onClick={() => setView('register')} className="btn-register-link">Daftar User Baru</button>
              </>
            )}

            {view === 'adminLogin' && (
              <>
                <h2>Login Admin</h2>
                <form onSubmit={(e) => handleLogin(e, 'admin')}>
                  <input type="text" placeholder="No IC Admin" onChange={e => setLoginData({...loginData, ic: e.target.value})} required />
                  <input type="password" placeholder="Password" onChange={e => setLoginData({...loginData, password: e.target.value})} required />
                  <button type="submit" className="btn-admin">Login Admin</button>
                </form>
                <button onClick={() => setView('login')} className="btn-back">Kembali</button>
              </>
            )}

            {view === 'register' && (
              <>
                <h2>Daftar Baru</h2>
                <form onSubmit={handleRegister}>
                  <input type="text" placeholder="No IC" onChange={e => setRegisterData({...registerData, ic: e.target.value})} required />
                  <input type="text" placeholder="Nama Penuh" onChange={e => setRegisterData({...registerData, name: e.target.value})} required />
                  <input type="email" placeholder="Emel" onChange={e => setRegisterData({...registerData, email: e.target.value})} required />
                  <input type="text" placeholder="Jabatan" onChange={e => setRegisterData({...registerData, jabatan: e.target.value})} required />
                  <input type="password" placeholder="Password" onChange={e => setRegisterData({...registerData, password: e.target.value})} required />
                  <button type="submit" className="btn-register">Daftar</button>
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
    <div className="dashboard">
      <nav>
        <span>Selamat datang, {user?.name}!</span>
        <button onClick={() => {setUser(null); setView('login');}}><LogOut size={16} /> Logout</button>
      </nav>

      <main>
        {view === 'userDashboard' && (
          <div className="user-section">
            <div className="card">
              <h3><Calendar size={20} /> Tempah Bilik</h3>
              <form onSubmit={handleBookRoom}>
                <select onChange={e => setBookingForm({...bookingForm, room_id: e.target.value})} required>
                  <option value="">Pilih Bilik</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <div className="grid">
                  <input type="date" onChange={e => setBookingForm({...bookingForm, start_date: e.target.value})} required />
                  <input type="time" onChange={e => setBookingForm({...bookingForm, start_time: e.target.value})} required />
                </div>
                <input type="text" placeholder="Tujuan Mesyuarat" onChange={e => setBookingForm({...bookingForm, purpose: e.target.value})} required />
                <button type="submit" className="btn-book">Hantar Tempahan</button>
              </form>
            </div>
          </div>
        )}
        
        {view === 'adminDashboard' && (
          <div className="admin-section">
            <h3>Dashboard Admin</h3>
            <p>Data Bilik & User akan dipaparkan di sini.</p>
            {/* Tambah UI Admin kau kat sini nanti */}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;