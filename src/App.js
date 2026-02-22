import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, LogOut, Users, Calendar, Home, History, Info, List, Image as ImageIcon, MapPin, Phone, Mail, Loader2 } from 'lucide-react';
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
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, table, data, idField, idValue })
      });
      return { success: true };
    } catch (e) { return null; }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await (await fetch(`${GOOGLE_SCRIPT_URL}?table=rooms`)).json();
      const b = await (await fetch(`${GOOGLE_SCRIPT_URL}?table=bookings`)).json();
      const u = await (await fetch(`${GOOGLE_SCRIPT_URL}?table=users`)).json();
      setRooms(r || []);
      setBookings(b || []);
      setUsers(u || []);
    } catch (e) { console.error("Fetch error", e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIK VALIDATION TARIKH ---
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
    if (!bookingFilter.start_date) return true; // Papar semua jika tarikh kosong
    const isOccupied = bookings.some(b => 
      b.room_id === room.id && b.status === 'approved' && 
      (bookingFilter.start_date <= b.end_date && (bookingFilter.end_date || bookingFilter.start_date) >= b.start_date)
    );
    return !isOccupied;
  });

  const handleLogin = (e, type) => {
    e.preventDefault();
    const found = users.find(u => String(u.ic) === loginData.ic && u.password === loginData.password);
    if (found) {
      if (type === 'admin' && found.role !== 'admin') return alert("Bukan Admin!");
      setUser(found); setView('dashboard');
      setActiveTab(found.role === 'admin' ? 'tindakan' : 'profile');
    } else alert("IC/Password Salah");
  };

  const handleUploadImages = async (e) => {
    const files = Array.from(e.target.files);
    const base64Images = await Promise.all(files.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
    }));
    setEditingRoom({ ...editingRoom, newImages: [...(editingRoom.newImages || []), ...base64Images] });
  };

  if (view !== 'dashboard') {
    return (
      <div className="login-container">
        <div className="login-right">
          <div className="form-card">
            <h2>{view === 'login' ? 'Selamat Datang' : view === 'adminLogin' ? 'Login Admin' : 'Daftar User'}</h2>
            <form onSubmit={(e) => handleLogin(e, view === 'adminLogin' ? 'admin' : 'user')}>
              <input type="text" placeholder="No IC" onChange={e => setLoginData({...loginData, ic: e.target.value})} required />
              <input type="password" placeholder="Password" onChange={e => setLoginData({...loginData, password: e.target.value})} required />
              <button type="submit" className="btn-user" disabled={loading}>{loading ? 'Sila Tunggu...' : 'Masuk'}</button>
            </form>
            <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="btn-back">
              {view === 'login' ? 'Daftar Akaun' : 'Kembali ke Login'}
            </button>
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
          <button onClick={() => window.location.reload()} className="logout-btn"><LogOut size={18}/> Keluar</button>
        </nav>
      </aside>

      <main className="content">
        {/* --- USER: TEMPAH BILIK --- */}
        {activeTab === 'book' && (
          <div className="card-pro">
            <h3>Pilih Tarikh Tempahan</h3>
            <div className="filter-row" style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
              <input type="date" value={bookingFilter.start_date} onChange={e => handleDateChange('start_date', e.target.value)} />
              <input type="date" value={bookingFilter.end_date} onChange={e => handleDateChange('end_date', e.target.value)} />
            </div>
            <div className="rooms-grid">
              {filteredRooms.map(room => (
                <div key={room.id} className="room-card-v2">
                  <img src={JSON.parse(room.images || '[""]') [0] || 'https://placehold.co/300x200'} alt="room" />
                  <div className="p-3">
                    <h4>{room.name}</h4>
                    <button 
                      className="btn-user" 
                      disabled={isSubmitting || !bookingFilter.start_date}
                      onClick={async () => {
                        setIsSubmitting(true);
                        const newB = { id: Date.now().toString(), room_id: room.id, room_name: room.name, user_ic: user.ic, user_name: user.name, email: user.email, start_date: bookingFilter.start_date, end_date: bookingFilter.end_date || bookingFilter.start_date, status: 'approved' };
                        await sheetCall('POST', 'bookings', newB);
                        alert("Tempahan Berjaya!");
                        await fetchData();
                        setIsSubmitting(false);
                        setActiveTab('history');
                      }}
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : 'Tempah Sekarang'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ADMIN: URUS BILIK --- */}
        {activeTab === 'manageRooms' && (
          <div className="card-pro">
            <div className="flex-header" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
              <h2>Urus Bilik</h2>
              <button className="btn-user" onClick={() => setEditingRoom({ name: '', capacity: '', images: '[]', isNew: true })}>+ Tambah Bilik</button>
            </div>
            <table className="pro-table">
              <thead><tr><th>Nama</th><th>Kapasiti</th><th>Aksi</th></tr></thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.capacity}</td>
                    <td>
                      <button onClick={() => setEditingRoom(r)} style={{marginRight:'10px'}}><Edit2 size={16} /></button>
                      <button onClick={() => { if(window.confirm("Hapus?")) sheetCall('DELETE', 'rooms', null, 'id', r.id).then(()=>fetchData()) }}><Trash2 size={16} color="red" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- MODAL EDIT/TAMBAH BILIK --- */}
        {editingRoom && (
          <div className="modal-overlay">
            <div className="modal-content card-pro">
              <h3>{editingRoom.isNew ? 'Tambah Bilik' : 'Kemaskini Bilik'}</h3>
              <input type="text" placeholder="Nama Bilik" value={editingRoom.name} onChange={e => setEditingRoom({...editingRoom, name: e.target.value})} />
              <input type="number" placeholder="Kapasiti" value={editingRoom.capacity} onChange={e => setEditingRoom({...editingRoom, capacity: e.target.value})} />
              
              <div className="image-upload-section">
                <label>Gambar Bilik (Boleh pilih banyak):</label>
                <input type="file" multiple onChange={handleUploadImages} />
                <div className="image-preview-grid" style={{display:'flex', gap:'5px', flexWrap:'wrap', marginTop:'10px'}}>
                  {(editingRoom.newImages || JSON.parse(editingRoom.images || '[]')).map((img, idx) => (
                    <img key={idx} src={img} style={{width:'60px', height:'60px', objectFit:'cover', borderRadius:'4px'}} alt="preview" />
                  ))}
                </div>
              </div>

              <div style={{marginTop:'20px', display:'flex', gap:'10px'}}>
                <button className="btn-user" onClick={async () => {
                  setIsSubmitting(true);
                  const finalData = { 
                    ...editingRoom, 
                    images: JSON.stringify(editingRoom.newImages || JSON.parse(editingRoom.images || '[]')),
                    id: editingRoom.id || Date.now().toString() 
                  };
                  delete finalData.newImages; delete finalData.isNew;
                  await sheetCall(editingRoom.isNew ? 'POST' : 'PATCH', 'rooms', finalData, 'id', editingRoom.id);
                  setEditingRoom(null); fetchData(); setIsSubmitting(false);
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