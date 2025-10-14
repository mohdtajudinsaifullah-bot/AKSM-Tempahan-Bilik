import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, LogOut, Users, Upload, Calendar } from 'lucide-react';

const SUPABASE_URL = 'https://lskzhncurhvbepaeimvc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxza3pobmN1cmh2YmVwYWVpbXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTMwMjUsImV4cCI6MjA3NTk2OTAyNX0.VNDQolojryauRaSUh2xj0JJ7qvB02cRy5roQs46Ly2s';

const supabaseCall = async (method, table, data = null, query = '') => {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  };

  let url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const options = { method, headers };
  if (data) options.body = JSON.stringify(data);

  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    console.error('Supabase error:', error);
    return null;
  }
};

export default function RoomBookingSystem() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  const [loginIC, setLoginIC] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');
  
  const [regForm, setRegForm] = useState({
    ic: '', password: '', confirmPassword: '', name: '', email: '', jabatan: ''
  });
  
  const [editRoom, setEditRoom] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', images: [] });
  const [bookingDates, setBookingDates] = useState({ startDate: '', endDate: '', startTime: '', duration: 1 });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', jabatan: '', role: 'user' });
  const [newUserForm, setNewUserForm] = useState({ ic: '', password: '', name: '', email: '', jabatan: '', role: 'user' });
  const [confirmCancel, setConfirmCancel] = useState(null);

  // Load data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const usersData = await supabaseCall('GET', 'users');
    const roomsData = await supabaseCall('GET', 'rooms');
    const bookingsData = await supabaseCall('GET', 'bookings');
    
    if (usersData) setUsers(usersData);
    if (roomsData) setRooms(roomsData);
    if (bookingsData) setBookings(bookingsData);
  };

  const handleUserLogin = () => {
    const user = users.find(u => u.ic === loginIC && u.password === loginPassword);
    if (user) {
      setCurrentUser({ ...user });
      setLoginIC('');
      setLoginPassword('');
      setAuthMode('login');
    } else {
      alert('No IC atau Password salah!');
    }
  };

  const handleAdminLogin = () => {
    const user = users.find(u => u.ic === loginIC && u.password === loginPassword && u.role === 'admin');
    if (user) {
      setCurrentUser({ ...user });
      setLoginIC('');
      setLoginPassword('');
      setAuthMode('login');
    } else {
      alert('No IC atau Password salah atau bukan Admin!');
    }
  };

  const handleRegister = () => {
    if (!regForm.ic || !regForm.password || !regForm.name || !regForm.email || !regForm.jabatan) {
      alert('Sila isi semua medan!');
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      alert('Password tidak sepadan!');
      return;
    }
    if (users.find(u => u.ic === regForm.ic)) {
      alert('No IC sudah terdaftar!');
      return;
    }
    
    supabaseCall('POST', 'users', { ...regForm, role: 'user' });
    setUsers([...users, { ...regForm, role: 'user' }]);
    alert('Pendaftaran berjaya! Sila log masuk.');
    setRegForm({ ic: '', password: '', confirmPassword: '', name: '', email: '', jabatan: '' });
    setAuthMode('login');
  };

  const handleLogout = () => setCurrentUser(null);

  // Room management
  const handleAddRoom = () => {
    if (formData.name && formData.description) {
      const newRoom = { 
        id: Date.now(), 
        name: formData.name, 
        description: formData.description,
        images: formData.images 
      };
      supabaseCall('POST', 'rooms', newRoom);
      setRooms([...rooms, newRoom]);
      setFormData({ name: '', description: '', images: [] });
    }
  };

  const handleEditRoom = (room) => {
    setEditRoom(room.id);
    setFormData({ name: room.name, description: room.description, images: room.images || [] });
  };

  const handleUpdateRoom = () => {
    setRooms(rooms.map(r => r.id === editRoom ? { ...r, ...formData } : r));
    supabaseCall('PATCH', 'rooms', formData, `?id=eq.${editRoom}`);
    setEditRoom(null);
    setFormData({ name: '', description: '', images: [] });
  };

  const handleDeleteRoom = (id) => {
    setRooms(rooms.filter(r => r.id !== id));
    supabaseCall('DELETE', 'rooms', null, `?id=eq.${id}`);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({...formData, images: [...formData.images, event.target.result]});
      };
      reader.readAsDataURL(file);
    });
  };

  // Check room availability
  const getAvailableRooms = () => {
    if (!bookingDates.startDate || !bookingDates.endDate || !bookingDates.startTime) return [];
    
    const available = rooms.filter(room => {
      const conflicts = bookings.filter(b => 
        b.room_id === room.id && 
        b.status !== 'cancelled' &&
        b.status !== 'rejected'
      );
      
      for (let booking of conflicts) {
        const bookStart = new Date(`${booking.start_date}T${booking.start_time}`);
        const bookEnd = new Date(`${booking.end_date}T${booking.start_time}`);
        const reqStart = new Date(`${bookingDates.startDate}T${bookingDates.startTime}`);
        const reqEnd = new Date(`${bookingDates.endDate}T${bookingDates.startTime}`);
        
        if (!(reqEnd < bookStart || reqStart > bookEnd)) {
          return false;
        }
      }
      return true;
    });
    
    return available;
  };

  const handleBookRoom = () => {
    if (!selectedRoom || !bookingDates.startDate || !bookingDates.endDate || !bookingDates.startTime) {
      alert('Sila isi semua medan!');
      return;
    }

    const newBooking = {
      id: Date.now(),
      room_id: selectedRoom,
      user_ic: currentUser.ic,
      user_name: currentUser.name,
      user_email: currentUser.email,
      start_date: bookingDates.startDate,
      end_date: bookingDates.endDate,
      start_time: bookingDates.startTime,
      duration: bookingDates.duration,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    supabaseCall('POST', 'bookings', newBooking);
    setBookings([...bookings, newBooking]);
    alert('Tempahan berjaya dihantar! Admin akan memproses tempahan anda.');
    setBookingDates({ startDate: '', endDate: '', startTime: '', duration: 1 });
    setSelectedRoom(null);
    
    // Send email notification (in real app, use backend)
    console.log('Email sent to admin');
  };

  const handleCancelBooking = (id) => {
    if (confirm('Adakah anda pasti ingin membatalkan tempahan ini?')) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      supabaseCall('PATCH', 'bookings', { status: 'cancelled' }, `?id=eq.${id}`);
    }
  };

  const handleApproveBooking = (id) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'approved' } : b));
    supabaseCall('PATCH', 'bookings', { status: 'approved' }, `?id=eq.${id}`);
    const booking = bookings.find(b => b.id === id);
    console.log('Approval email sent to:', booking.user_email);
  };

  const handleRejectBooking = (id) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'rejected' } : b));
    supabaseCall('PATCH', 'bookings', { status: 'rejected' }, `?id=eq.${id}`);
    const booking = bookings.find(b => b.id === id);
    console.log('Rejection email sent to:', booking.user_email);
  };

  const handleAddUserByAdmin = () => {
    if (!newUserForm.ic || !newUserForm.password || !newUserForm.name || !newUserForm.email || !newUserForm.jabatan) {
      alert('Sila isi semua medan!');
      return;
    }
    if (users.find(u => u.ic === newUserForm.ic)) {
      alert('No IC sudah terdaftar!');
      return;
    }
    supabaseCall('POST', 'users', newUserForm);
    setUsers([...users, newUserForm]);
    setNewUserForm({ ic: '', password: '', name: '', email: '', jabatan: '', role: 'user' });
  };

  const handleEditUserClick = (user) => {
    setEditUser(user.ic);
    setEditUserForm({ name: user.name, email: user.email, jabatan: user.jabatan, role: user.role });
  };

  const handleUpdateUser = () => {
    setUsers(users.map(u => u.ic === editUser ? { ...u, ...editUserForm } : u));
    supabaseCall('PATCH', 'users', editUserForm, `?ic=eq.${editUser}`);
    setEditUser(null);
    setEditUserForm({ name: '', email: '', jabatan: '', role: 'user' });
  };

  const handleDeleteUser = (ic) => {
    setUsers(users.filter(u => u.ic !== ic));
    supabaseCall('DELETE', 'users', null, `?ic=eq.${ic}`);
  };

  const getRoomName = (roomId) => rooms.find(r => r.id === roomId)?.name || 'Unknown';

  // Login page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{backgroundImage: 'url(https://www.nationalenergyawards.com.my/storage/2024/09/PJH2.jpg)'}}>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
          {/* Left Info */}
          <div className="text-white p-8 flex flex-col justify-center">
            <h2 className="text-5xl font-bold mb-6">Sistem Tempahan Bilik AKSM</h2>
            <p className="text-3xl mb-8">Akademi Kehakiman Syariah Malaysia</p>
            
            <div className="space-y-6">
              <div>
                <p className="font-bold text-3xl mb-2">📍 Lokasi:</p>
                <p className="text-xl leading-relaxed">Tingkat 6, Menara PJH, 2, Jalan Tun Abdul Razak, Presint 2, 62000 Putrajaya</p>
              </div>
              <div>
                <p className="font-bold text-3xl mb-2">📞 No. Telefon:</p>
                <p className="text-xl">0123456785</p>
              </div>
              <div>
                <p className="font-bold text-3xl mb-2">📧 Emel:</p>
                <p className="text-xl">aksm@esyariah.gov.my</p>
              </div>
            </div>
          </div>

          {/* Right Login */}
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">Selamat Datang</h1>
            
            {authMode === 'login' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="No IC"
                  value={loginIC}
                  onChange={(e) => setLoginIC(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUserLogin()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <button onClick={handleUserLogin} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition">
                  Login Sebagai User
                </button>

                <button onClick={() => setAuthMode('adminlogin')} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition">
                  Login Sebagai Admin
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                  <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">atau</span></div>
                </div>

                <button onClick={() => setAuthMode('register')} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition">
                  Daftar Sebagai User Baru
                </button>
              </div>
            )}

            {authMode === 'adminlogin' && (
              <div className="space-y-4">
                <p className="text-gray-600 font-semibold mb-4">Login Admin</p>
                <input
                  type="text"
                  placeholder="No IC Admin"
                  value={loginIC}
                  onChange={(e) => setLoginIC(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                
                <button onClick={handleAdminLogin} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition">
                  Login Admin
                </button>

                <button onClick={() => setAuthMode('login')} className="w-full bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition">
                  Kembali
                </button>
              </div>
            )}

            {authMode === 'register' && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <p className="text-gray-600 font-semibold mb-4">Daftar Pengguna Baru</p>
                <input type="text" placeholder="No IC" value={regForm.ic} onChange={(e) => setRegForm({...regForm, ic: e.target.value})} className="w-full px-4 py-2 border rounded text-sm" />
                <input type="text" placeholder="Nama Penuh" value={regForm.name} onChange={(e) => setRegForm({...regForm, name: e.target.value})} className="w-full px-4 py-2 border rounded text-sm" />
                <input type="email" placeholder="Emel" value={regForm.email} onChange={(e) => setRegForm({...regForm, email: e.target.value})} className="w-full px-4 py-2 border rounded text-sm" />
                <input type="text" placeholder="Jabatan" value={regForm.jabatan} onChange={(e) => setRegForm({...regForm, jabatan: e.target.value})} className="w-full px-4 py-2 border rounded text-sm" />
                <input type="password" placeholder="Password" value={regForm.password} onChange={(e) => setRegForm({...regForm, password: e.target.value})} className="w-full px-4 py-2 border rounded text-sm" />
                <input type="password" placeholder="Sahkan Password" value={regForm.confirmPassword} onChange={(e) => setRegForm({...regForm, confirmPassword: e.target.value})} className="w-full px-4 py-2 border rounded text-sm" />
                
                <button onClick={handleRegister} className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded font-semibold text-sm transition">
                  Daftar
                </button>

                <button onClick={() => setAuthMode('login')} className="w-full bg-gray-400 hover:bg-gray-500 text-white py-2 rounded font-semibold text-sm transition">
                  Kembali
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin page
  if (currentUser.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-red-600 text-white p-6 shadow">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Admin - Sistem Tempahan Bilik AKSM</h1>
              <p className="text-sm text-red-100">Selamat datang, {currentUser.name}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Profil Pengguna */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2"><Users size={24} /> Profile Pengguna</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6 bg-gray-50 p-4 rounded">
              <input type="text" placeholder="No IC" value={newUserForm.ic} onChange={(e) => setNewUserForm({...newUserForm, ic: e.target.value})} className="px-3 py-2 border rounded text-sm" />
              <input type="password" placeholder="Password" value={newUserForm.password} onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})} className="px-3 py-2 border rounded text-sm" />
              <input type="text" placeholder="Nama" value={newUserForm.name} onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})} className="px-3 py-2 border rounded text-sm" />
              <input type="email" placeholder="Emel" value={newUserForm.email} onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})} className="px-3 py-2 border rounded text-sm" />
              <input type="text" placeholder="Jabatan" value={newUserForm.jabatan} onChange={(e) => setNewUserForm({...newUserForm, jabatan: e.target.value})} className="px-3 py-2 border rounded text-sm" />
              <select value={newUserForm.role} onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})} className="px-3 py-2 border rounded text-sm">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button onClick={handleAddUserByAdmin} className="mb-6 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold">
              <Plus size={20} /> Daftarkan Pengguna Baru
            </button>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">No IC</th>
                    <th className="px-4 py-2 text-left">Nama</th>
                    <th className="px-4 py-2 text-left">Emel</th>
                    <th className="px-4 py-2 text-left">Jabatan</th>
                    <th className="px-4 py-2 text-left">Peranan</th>
                    <th className="px-4 py-2 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.ic} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{user.ic}</td>
                      <td className="px-4 py-2">{editUser === user.ic ? <input type="text" value={editUserForm.name} onChange={(e) => setEditUserForm({...editUserForm, name: e.target.value})} className="px-2 py-1 border rounded text-sm w-full" /> : user.name}</td>
                      <td className="px-4 py-2">{editUser === user.ic ? <input type="email" value={editUserForm.email} onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})} className="px-2 py-1 border rounded text-sm w-full" /> : user.email}</td>
                      <td className="px-4 py-2">{editUser === user.ic ? <input type="text" value={editUserForm.jabatan} onChange={(e) => setEditUserForm({...editUserForm, jabatan: e.target.value})} className="px-2 py-1 border rounded text-sm w-full" /> : user.jabatan}</td>
                      <td className="px-4 py-2">{editUser === user.ic ? <select value={editUserForm.role} onChange={(e) => setEditUserForm({...editUserForm, role: e.target.value})} className="px-2 py-1 border rounded text-sm"><option value="user">User</option><option value="admin">Admin</option></select> : <span className={user.role === 'admin' ? 'bg-red-100 text-red-800 px-2 py-1 rounded' : 'bg-blue-100 text-blue-800 px-2 py-1 rounded'}>{user.role}</span>}</td>
                      <td className="px-4 py-2 text-center">
                        {editUser === user.ic ? (
                          <div className="flex gap-2 justify-center">
                            <button onClick={handleUpdateUser} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">Simpan</button>
                            <button onClick={() => setEditUser(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm">Batal</button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => handleEditUserClick(user)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">Edit</button>
                            <button onClick={() => handleDeleteUser(user.ic)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Padam</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Profil Bilik */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Profil Bilik</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input type="text" placeholder="Nama bilik" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="px-4 py-2 border rounded" />
              <input type="text" placeholder="Deskripsi" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="px-4 py-2 border rounded" />
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
                  <Upload size={20} /> Upload Gambar (Multiple)
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt={`room-${idx}`} className="w-full h-24 object-cover rounded" />
                    <button onClick={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">✕</button>
                  </div>
                ))}
              </div>
            )}
            
            <button onClick={editRoom ? handleUpdateRoom : handleAddRoom} className="mb-6 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold">
              <Plus size={20} /> {editRoom ? 'Kemaskini Bilik' : 'Tambah Bilik'}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rooms.map(room => (
                <div key={room.id} className="border rounded-lg p-4 hover:shadow-lg transition">
                  {room.images && room.images.length > 0 && (
                    <img src={room.images[0]} alt={room.name} className="w-full h-32 object-cover rounded mb-2" />
                  )}
                  <h3 className="font-bold text-lg text-gray-800">{room.name}</h3>
                  <p className="text-sm text-gray-600 mt-2">{room.description}</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleEditRoom(room)} className="flex-1 flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-sm">
                      <Edit2 size={16} /> Edit
                    </button>
                    <button onClick={() => handleDeleteRoom(room.id)} className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm">
                      <Trash2 size={16} /> Padam
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lulus Tempahan */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Tempahan Menunggu Pengesahan</h2>
            
            <div className="space-y-4">
              {bookings.filter(b => b.status === 'pending').length === 0 ? (
                <p className="text-gray-600">Tiada tempahan menunggu pengesahan</p>
              ) : (
                bookings.filter(b => b.status === 'pending').map(booking => (
                  <div key={booking.id} className="border rounded-lg p-4 flex justify-between items-center bg-yellow-50">
                    <div>
                      <p className="font-semibold">{getRoomName(booking.room_id)}</p>
                      <p className="text-sm text-gray-600">{booking.user_name} ({booking.user_email}) | {booking.start_date} hingga {booking.end_date} | {booking.start_time}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveBooking(booking.id)} className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                        <Check size={18} /> Lulus
                      </button>
                      <button onClick={() => handleRejectBooking(booking.id)} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                        <X size={18} /> Tolak
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <h3 className="text-lg font-bold mt-8 mb-4 text-gray-800">Tempahan Diluluskan</h3>
            <div className="space-y-2">
              {bookings.filter(b => b.status === 'approved').length === 0 ? (
                <p className="text-gray-600">Tiada tempahan diluluskan</p>
              ) : (
                bookings.filter(b => b.status === 'approved').map(booking => (
                  <div key={booking.id} className="border rounded-lg p-4 bg-green-50 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{getRoomName(booking.room_id)}</p>
                      <p className="text-sm text-gray-600">{booking.user_name} | {booking.start_date} hingga {booking.end_date}</p>
                    </div>
                    <button onClick={() => handleCancelBooking(booking.id)} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm">
                      Batalkan
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User page
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-6 shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Sistem Tempahan Bilik AKSM</h1>
            <p className="text-sm text-blue-100">Selamat datang, {currentUser.name}!</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Maklumat Profil */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Maklumat Profil Saya</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">No IC</p>
              <p className="font-semibold text-gray-800">{currentUser.ic}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nama</p>
              <p className="font-semibold text-gray-800">{currentUser.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Emel</p>
              <p className="font-semibold text-gray-800">{currentUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Jabatan</p>
              <p className="font-semibold text-gray-800">{currentUser.jabatan}</p>
            </div>
          </div>
        </div>

        {/* Pilih Tarikh & Masa */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2"><Calendar size={24} /> Pilih Tarikh & Masa</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Tarikh Mula</label>
              <input 
                type="date" 
                value={bookingDates.startDate} 
                onChange={(e) => setBookingDates({...bookingDates, startDate: e.target.value})} 
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Tarikh Tamat</label>
              <input 
                type="date" 
                value={bookingDates.endDate} 
                onChange={(e) => setBookingDates({...bookingDates, endDate: e.target.value})} 
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Masa Mula</label>
              <input 
                type="time" 
                value={bookingDates.startTime} 
                onChange={(e) => setBookingDates({...bookingDates, startTime: e.target.value})} 
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Tempoh (Hari)</label>
              <input 
                type="number" 
                min="1"
                value={bookingDates.duration} 
                onChange={(e) => setBookingDates({...bookingDates, duration: parseInt(e.target.value)})} 
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bilik Tersedia */}
        {bookingDates.startDate && bookingDates.endDate && bookingDates.startTime ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Bilik Tersedia</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getAvailableRooms().length === 0 ? (
                <p className="col-span-full text-gray-600 text-center py-8">Tiada bilik tersedia untuk tarikh dan masa yang dipilih</p>
              ) : (
                getAvailableRooms().map(room => (
                  <div key={room.id} className={`border-2 rounded-lg p-6 cursor-pointer transition ${selectedRoom === room.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`} onClick={() => setSelectedRoom(room.id)}>
                    {room.images && room.images.length > 0 && (
                      <img src={room.images[0]} alt={room.name} className="w-full h-40 object-cover rounded mb-4" />
                    )}
                    <h3 className="font-bold text-xl text-gray-800 mb-2">{room.name}</h3>
                    <p className="text-gray-600 mb-3">{room.description}</p>
                    {selectedRoom === room.id && (
                      <button onClick={(e) => { e.stopPropagation(); handleBookRoom(); }} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-semibold mt-4">
                        Tempah Bilik Ini
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-800">Sila pilih tarikh, masa, dan tempoh terlebih dahulu untuk melihat bilik yang tersedia</p>
          </div>
        )}

        {/* Tempahan Saya */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Tempahan Saya</h2>
          
          {bookings.filter(b => b.user_ic === currentUser.ic).length === 0 ? (
            <p className="text-gray-600 text-center py-8">Anda belum membuat sebarang tempahan</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Bilik</th>
                    <th className="px-4 py-2 text-left">Tarikh Mula</th>
                    <th className="px-4 py-2 text-left">Tarikh Tamat</th>
                    <th className="px-4 py-2 text-left">Masa</th>
                    <th className="px-4 py-2 text-left">Tempoh (Hari)</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.filter(b => b.user_ic === currentUser.ic).map(booking => (
                    <tr key={booking.id} className={`border-b ${booking.status === 'approved' ? 'bg-green-50' : booking.status === 'pending' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                      <td className="px-4 py-2 font-semibold">{getRoomName(booking.room_id)}</td>
                      <td className="px-4 py-2">{booking.start_date}</td>
                      <td className="px-4 py-2">{booking.end_date}</td>
                      <td className="px-4 py-2">{booking.start_time}</td>
                      <td className="px-4 py-2">{booking.duration}</td>
                      <td className="px-4 py-2">
                        <span className={`px-3 py-1 rounded font-semibold ${
                          booking.status === 'approved' ? 'bg-green-200 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                          booking.status === 'cancelled' ? 'bg-gray-200 text-gray-800' :
                          'bg-red-200 text-red-800'
                        }`}>
                          {booking.status === 'approved' ? 'Diluluskan ✓' : booking.status === 'pending' ? 'Menunggu' : booking.status === 'cancelled' ? 'Dibatalkan' : 'Ditolak'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {(booking.status === 'approved' || booking.status === 'pending') && (
                          <button onClick={() => handleCancelBooking(booking.id)} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm">
                            Batalkan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}