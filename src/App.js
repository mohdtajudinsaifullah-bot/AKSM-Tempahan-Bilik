import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X, LogOut, Users, Calendar, Home, History, Info, List, Image as ImageIcon } from 'lucide-react';
import './App.css';

const GOOGLE_SCRIPT_URL = 'URL_GOOGLE_SCRIPT_KAU';

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

  // LOGIK FILTER BILIK AVAILABLE
  const availableRooms = rooms.filter(room => {
    if (!bookingFilter.start_date) return false;
    const isOccupied = bookings.some(b => 
      b.room_id === room.id && 
      b.status === 'approved' && 
      (bookingFilter.start_date <= b.end_date && (bookingFilter.end_date || bookingFilter.start_date) >= b.start_date)
    );
    return !isOccupied;
  });

  // FUNCTION UPLOAD GAMBAR BANYAK
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

  if (view === 'login') { /* ... Kod Login Sedia Ada ... */ }

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
        {/* TAB: TEMPAH BILIK (USER) */}
        {activeTab === 'book' && (
          <div className="booking-section">
            <div className="card-pro mb-4">
              <h3>1. Pilih Tarikh Tempahan</h3>
              <div className="filter-row">
                <input type="date" onChange={e => setBookingFilter({...bookingFilter, start_date: e.target.value})} />
                <span>Hingga</span>
                <input type="date" onChange={e => setBookingFilter({...bookingFilter, end_date: e.target.value})} />
              </div>
            </div>
            <div className="rooms-grid">
              {availableRooms.map(room => (
                <div key={room.id} className="room-card-v2">
                  <img src={JSON.parse(room.images || '[""]')[0]} alt="bilik" />
                  <div className="room-info">
                    <h4>{room.name} (Kapasiti: {room.capacity})</h4>
                    <button className="btn-user" onClick={async () => {
                      const newB = { id: Date.now().toString(), room_id: room.id, room_name: room.name, user_ic: user.ic, user_name: user.name, email: user.email, start_date: bookingFilter.start_date, end_date: bookingFilter.end_date || bookingFilter.start_date, status: 'approved' };
                      await sheetCall('POST', 'bookings', newB);
                      alert("Tempahan Berjaya & Auto-Lulus! Emel dihantar.");
                      fetchData(); setActiveTab('history');
                    }}>Tempah Sekarang</button>
                  </div>
                </div>
              ))}
              {bookingFilter.start_date && availableRooms.length === 0 && <p>Tiada bilik kosong pada tarikh ini.</p>}
            </div>
          </div>
        )}

        {/* TAB: TINDAKAN (ADMIN) */}
        {activeTab === 'tindakan' && (
          <div className="card-pro">
            <h2>Tindakan Admin (Ubah/Batal Status)</h2>
            <table className="pro-table">
              <thead><tr><th>Pemohon</th><th>Bilik</th><th>Tarikh</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>{b.user_name}</td><td>{b.room_name}</td><td>{b.start_date}</td>
                    <td><span className={`badge ${b.status}`}>{b.status}</span></td>
                    <td>
                      <button className="btn-reject" onClick={() => sheetCall('PATCH', 'bookings', {status: 'rejected'}, 'id', b.id).then(()=>fetchData())}>Batal</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: SENARAI TEMPAHAN (ADMIN) */}
        {activeTab === 'senarai' && (
          <div className="card-pro">
            <h2>Senarai Semua Tempahan</h2>
            <table className="pro-table">
              <thead><tr><th>Bilik</th><th>Pemohon</th><th>Tarikh Mula</th><th>Tarikh Tamat</th></tr></thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}><td>{b.room_name}</td><td>{b.user_name}</td><td>{b.start_date}</td><td>{b.end_date}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: URUS BILIK (ADMIN - UPLOAD GAMBAR) */}
        {activeTab === 'manageRooms' && (
          <div className="card-pro">
            <div className="flex-header">
              <h2>Urus Bilik</h2>
              <button className="btn-add" onClick={async () => {
                const name = prompt("Nama Bilik:");
                const cap = prompt("Kapasiti:");
                if(name) {
                  // Simulasi upload (Sebenarnya guna input file di UI)
                  alert("Sila gunakan borang tambah bilik di bawah.");
                }
              }}>+ Tambah</button>
            </div>
            {/* Borang Tambah Bilik dengan Multiple Images */}
            <div className="add-room-form">
               <input type="file" multiple onChange={async (e) => {
                 const imgs = await handleMultipleImages(e);
                 // Simpan imgs (array) ke Google Sheets sebagai JSON string
                 console.log(JSON.stringify(imgs));
               }} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}