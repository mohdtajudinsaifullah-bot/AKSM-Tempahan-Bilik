import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, LogOut, Users, Upload, Calendar, MapPin, Phone, Mail, Home, History, Info } from 'lucide-react';
import './App.css';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQXq-tTufBZ1kwwYYd85DTmR2KQ1KK-gZI3e65c24rVMJ54IlE4cbY6DOJVG2tvSQo/exec';

function App() {
  const [view, setView] = useState('login');
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form States
  const [loginData, setLoginData] = useState({ ic: '', password: '' });
  const [roomForm, setRoomForm] = useState({ name: '', capacity: '', description: '', images: [] });
  const [bookingFilter, setBookingFilter] = useState({ start_date: '', end_date: '', start_time: '', end_time: '' });
  const [selectedRoom, setSelectedRoom] = useState(null);

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

  // Logik Check Bilik Kosong
  const getAvailableRooms = () => {
    if (!bookingFilter.start_date || !bookingFilter.start_time) return [];
    
    return rooms.filter(room => {
      const isBooked = bookings.some(b => {
        if (b.room_id !== room.id || b.status === 'rejected') return false;
        // Logik ringkas pertembungan masa
        return (bookingFilter.start_date <= b.end_date && bookingFilter.end_date >= b.start_date);
      });
      return !isBooked;
    });
  };

  // Image Upload Handler (Multiple)
  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRoomForm(prev => ({ ...prev, images: [...prev.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddRoom = async () => {
    const newRoom = { ...roomForm, id: Date.now().toString(), images: JSON.stringify(roomForm.images) };
    await sheetCall('POST', 'rooms', newRoom);
    alert("Bilik ditambah!");
    setRoomForm({ name: '', capacity: '', description: '', images: [] });
    fetchData();
  };

  if (view === 'login') { /* ... Guna kod login lama kau ... */ }

  return (
    <div className="app-wrapper">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>AKSM Booking</h3>
          <p>{user?.role === 'admin' ? 'ADMIN PANEL' : 'USER PANEL'}</p>
        </div>
        <nav className="menu">
          {user?.role === 'admin' ? (
            <>
              <button onClick={() => setActiveTab('manageRooms')} className={activeTab === 'manageRooms' ? 'active' : ''}><Home size={18}/> Urus Bilik</button>
              <button onClick={() => setActiveTab('manageBookings')} className={activeTab === 'manageBookings' ? 'active' : ''}><Calendar size={18}/> Kelulusan</button>
            </>
          ) : (
            <>
              <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'active' : ''}><Info size={18}/> Maklumat User</button>
              <button onClick={() => setActiveTab('book')} className={activeTab === 'book' ? 'active' : ''}><Plus size={18}/> Tempahan Baru</button>
              <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}><History size={18}/> Sejarah</button>
            </>
          )}
          <button onClick={() => window.location.reload()} className="logout-btn"><LogOut size={18}/> Keluar</button>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="content">
        {/* VIEW: MAKLUMAT USER */}
        {activeTab === 'profile' && (
          <div className="card-pro">
            <h2>Profil Pengguna</h2>
            <div className="profile-grid">
              <p><strong>Nama:</strong> {user?.name}</p>
              <p><strong>IC:</strong> {user?.ic}</p>
              <p><strong>Jabatan:</strong> {user?.jabatan}</p>
              <p><strong>Emel:</strong> {user?.email}</p>
            </div>
          </div>
        )}

        {/* VIEW: TEMPAHAN BARU (FILTER DULU) */}
        {activeTab === 'book' && (
          <div className="booking-flow">
            <div className="card-pro">
              <h3>1. Pilih Tarikh & Masa</h3>
              <div className="filter-grid">
                <input type="date" onChange={e => setBookingFilter({...bookingFilter, start_date: e.target.value})} />
                <input type="time" onChange={e => setBookingFilter({...bookingFilter, start_time: e.target.value})} />
                <span>Hingga</span>
                <input type="date" onChange={e => setBookingFilter({...bookingFilter, end_date: e.target.value})} />
                <input type="time" onChange={e => setBookingFilter({...bookingFilter, end_time: e.target.value})} />
              </div>
            </div>

            <div className="rooms-list">
              <h3>2. Bilik Tersedia</h3>
              <div className="rooms-grid">
                {getAvailableRooms().map(room => (
                  <div key={room.id} className="room-card-v2">
                    <img src={JSON.parse(room.images || "[]")[0] || 'placeholder.jpg'} alt="room" />
                    <div className="room-info">
                      <h4>{room.name}</h4>
                      <p>Kapasiti: {room.capacity} Orang</p>
                      <button onClick={() => setSelectedRoom(room)} className="btn-select">Pilih Bilik</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: ADMIN MANAGE ROOMS */}
        {activeTab === 'manageRooms' && (
          <div className="admin-rooms">
            <div className="card-pro">
              <h3>Tambah Bilik Baru</h3>
              <input type="text" placeholder="Nama Bilik" onChange={e => setRoomForm({...roomForm, name: e.target.value})} />
              <input type="number" placeholder="Kapasiti" onChange={e => setRoomForm({...roomForm, capacity: e.target.value})} />
              <textarea placeholder="Deskripsi" onChange={e => setRoomForm({...roomForm, description: e.target.value})} />
              <input type="file" multiple onChange={handleImages} />
              <div className="preview-imgs">
                {roomForm.images.map((img, i) => <img key={i} src={img} width="50" />)}
              </div>
              <button onClick={handleAddRoom} className="btn-add">Simpan Bilik</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;