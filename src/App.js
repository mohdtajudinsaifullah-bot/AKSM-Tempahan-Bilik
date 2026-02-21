import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, LogOut, Users, Upload, Calendar, MapPin, Phone, Mail, Home, History, Info, Users as UsersIcon } from 'lucide-react';
import './App.css';

// TUKAR URL NI DENGAN URL GOOGLE SCRIPT KAU
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQXq-tTufBZ1kwwYYd85DTmR2KQ1KK-gZI3e65c24rVMJ54IlE4cbY6DOJVG2tvSQo/exec';

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
    const foundUser = usersData?.find(u => String(u.ic) === String(loginData.ic) && String(u.password) === String(loginData.password));
    
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
            <h2><Info /> Maklumat Peribadi</h2>
            <div className="profile-info">
              <p><strong>Nama:</strong> {user?.name}</p>
              <p><strong>No IC:</strong> {user?.ic}</p>
              <p><strong>Jabatan:</strong> {user?.jabatan}</p>
              <p><strong>Emel:</strong> {user?.email}</p>
            </div>
          </div>
        )}

        {activeTab === 'book' && (
          <div className="booking-section">
            <div className="card-pro" style={{marginBottom: '20px'}}>
              <h3>1. Pilih Waktu Tempahan</h3>
              <div style={{display: 'flex', gap: '20px', marginTop: '10px'}}>
                <div style={{flex: 1}}>
                  <label>Tarikh Mula</label>
                  <input type="date" className="pro-input" style={{width: '100%', padding: '10px'}} onChange={e => setBookingFilter({...bookingFilter, start_date: e.target.value})} />
                </div>
                <div style={{flex: 1}}>
                  <label>Tarikh Tamat</label>
                  <input type="date" className="pro-input" style={{width: '100%', padding: '10px'}} onChange={e => setBookingFilter({...bookingFilter, end_date: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="rooms-grid">
              {rooms.map(room => (
                <div key={room.id} className="room-card-v2" style={{position: 'relative'}}>
                  <div className="room-badge">{room.capacity} Orang</div>
                  <img src={JSON.parse(room.images || '[""]') [0] || 'https://placehold.co/600x400?text=Bilik'} alt="bilik" style={{width: '100%', height: '150px', objectFit: 'cover'}} />
                  <div className="room-info" style={{padding: '15px'}}>
                    <h4>{room.name}</h4>
                    <p style={{fontSize: '0.9rem', color: '#64748b'}}>{room.description}</p>
                    <button className="btn-user" style={{marginTop: '10px'}} onClick={async () => {
                      if(!bookingFilter.start_date) return alert("Sila pilih tarikh dulu!");
                      const newB = {
                        id: Date.now().toString(),
                        room_id: room.id,
                        room_name: room.name,
                        user_ic: user.ic,
                        user_name: user.name,
                        start_date: bookingFilter.start_date,
                        end_date: bookingFilter.end_date || bookingFilter.start_date,
                        status: 'pending'
                      };
                      await sheetCall('POST', 'bookings', newB);
                      alert("Tempahan berjaya dihantar!");
                      setActiveTab('history');
                      fetchData();
                    }}>Tempah Sekarang</button>
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
              <thead>
                <tr>
                  <th>Bilik</th>
                  <th>Tarikh</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings?.filter(b => String(b.user_ic) === String(user.ic)).map(b => (
                  <tr key={b.id}>
                    <td>{b.room_name}</td>
                    <td>{b.start_date}</td>
                    <td><span className={`badge ${b.status}`}>{b.status?.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'manageBookings' && (
          <div className="card-pro">
            <h2><Check /> Senarai Kelulusan</h2>
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Pemohon</th>
                  <th>Bilik</th>
                  <th>Tarikh</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {bookings?.filter(b => b.status === 'pending').map(b => (
                  <tr key={b.id}>
                    <td>{b.user_name}</td>
                    <td>{b.room_name}</td>
                    <td>{b.start_date}</td>
                    <td className="actions">
                      <button className="btn-approve" onClick={() => sheetCall('PATCH', 'bookings', {status: 'approved'}, 'id', b.id).then(()=>fetchData())}><Check size={16}/></button>
                      <button className="btn-reject" onClick={() => sheetCall('PATCH', 'bookings', {status: 'rejected'}, 'id', b.id).then(()=>fetchData())}><X size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'manageRooms' && (
          <div className="card-pro">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2><Home /> Urus Bilik</h2>
              <button className="btn-register" style={{width: 'auto', padding: '10px 20px'}} onClick={() => {
                const name = prompt("Nama Bilik:");
                if(name) sheetCall('POST', 'rooms', {id: Date.now().toString(), name, capacity: 10, images: '[]', description: 'Bilik Baru'}).then(()=>fetchData());
              }}>+ Tambah Bilik</button>
            </div>
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Nama Bilik</th>
                  <th>Kapasiti</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {rooms?.map(r => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.capacity} Orang</td>
                    <td><button className="btn-reject" style={{padding: '5px'}} onClick={() => alert("Fungsi delete menyusul")}><Trash2 size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'manageUsers' && (
          <div className="card-pro">
            <h2><UsersIcon /> Senarai Pengguna</h2>
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>IC</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users?.map(u => (
                  <tr key={u.ic}>
                    <td>{u.name}</td>
                    <td>{u.ic}</td>
                    <td><span className="badge user">{u.role}</span></td>
                  </tr>
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