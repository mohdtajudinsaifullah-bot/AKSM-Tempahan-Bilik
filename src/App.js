import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, LogOut, Users } from 'lucide-react';

export default function RoomBookingSystem() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([
    { ic: '123456789012', password: 'admin123', name: 'Admin User', email: 'admin@aksm.gov.my', jabatan: 'IT', role: 'admin' },
    { ic: '987654321098', password: 'user123', name: 'Ahmad Aziz', email: 'ahmad@aksm.gov.my', jabatan: 'Keuangan', role: 'user' }
  ]);
  
  const [rooms, setRooms] = useState([
    { id: 1, name: 'Bilik A', capacity: 10, price: 100, description: 'Bilik mesyuarat kecil' },
    { id: 2, name: 'Bilik B', capacity: 20, price: 200, description: 'Bilik mesyuarat sederhana' },
    { id: 3, name: 'Bilik C', capacity: 50, price: 500, description: 'Bilik auditorium besar' }
  ]);
  
  const [bookings, setBookings] = useState([
    { id: 1, roomId: 1, userIC: '987654321098', userName: 'Ahmad Aziz', date: '2025-10-20', time: '10:00', duration: 2, status: 'pending' },
    { id: 2, roomId: 2, userIC: '987654321098', userName: 'Ahmad Aziz', date: '2025-10-21', time: '14:00', duration: 3, status: 'approved' }
  ]);
  
  // Login & Register states
  const [loginIC, setLoginIC] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // login, register, adminlogin
  
  // Register form
  const [regForm, setRegForm] = useState({
    ic: '', password: '', confirmPassword: '', name: '', email: '', jabatan: ''
  });
  
  // Admin management
  const [editRoom, setEditRoom] = useState(null);
  const [formData, setFormData] = useState({ name: '', capacity: '', price: '', description: '' });
  const [bookingForm, setBookingForm] = useState({ roomId: '', date: '', time: '', duration: '' });
  const [editUser, setEditUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', jabatan: '', role: 'user' });
  const [newUserForm, setNewUserForm] = useState({ ic: '', password: '', name: '', email: '', jabatan: '', role: 'user' });

  // Login functions
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
    
    setUsers([...users, { ...regForm, role: 'user' }]);
    alert('Pendaftaran berjaya! Sila log masuk.');
    setRegForm({ ic: '', password: '', confirmPassword: '', name: '', email: '', jabatan: '' });
    setAuthMode('login');
  };

  const handleLogout = () => setCurrentUser(null);

  // Room management
  const handleAddRoom = () => {
    if (formData.name && formData.capacity && formData.price) {
      setRooms([...rooms, { 
        id: Date.now(), 
        name: formData.name, 
        capacity: parseInt(formData.capacity),
        price: parseInt(formData.price),
        description: formData.description 
      }]);
      setFormData({ name: '', capacity: '', price: '', description: '' });
    }
  };

  const handleEditRoom = (room) => {
    setEditRoom(room.id);
    setFormData({ name: room.name, capacity: room.capacity, price: room.price, description: room.description });
  };

  const handleUpdateRoom = () => {
    setRooms(rooms.map(r => r.id === editRoom ? { ...r, ...formData, capacity: parseInt(formData.capacity), price: parseInt(formData.price) } : r));
    setEditRoom(null);
    setFormData({ name: '', capacity: '', price: '', description: '' });
  };

  const handleDeleteRoom = (id) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

  // Booking management
  const handleBookRoom = () => {
    if (bookingForm.roomId && bookingForm.date && bookingForm.time && bookingForm.duration) {
      setBookings([...bookings, {
        id: Date.now(),
        roomId: parseInt(bookingForm.roomId),
        userIC: currentUser.ic,
        userName: currentUser.name,
        date: bookingForm.date,
        time: bookingForm.time,
        duration: parseInt(bookingForm.duration),
        status: 'pending'
      }]);
      setBookingForm({ roomId: '', date: '', time: '', duration: '' });
    }
  };

  const handleApproveBooking = (id) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'approved' } : b));
  };

  const handleRejectBooking = (id) => {
    setBookings(bookings.filter(b => b.id !== id));
  };

  // User management by admin
  const handleEditUserClick = (user) => {
    setEditUser(user.ic);
    setEditUserForm({ name: user.name, email: user.email, jabatan: user.jabatan, role: user.role });
  };

  const handleUpdateUser = () => {
    setUsers(users.map(u => u.ic === editUser ? { ...u, ...editUserForm } : u));
    setEditUser(null);
    setEditUserForm({ name: '', email: '', jabatan: '', role: 'user' });
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
    setUsers([...users, newUserForm]);
    setNewUserForm({ ic: '', password: '', name: '', email: '', jabatan: '', role: 'user' });
  };

  const handleDeleteUser = (ic) => {
    setUsers(users.filter(u => u.ic !== ic));
  };

  const getRoomName = (roomId) => rooms.find(r => r.id === roomId)?.name || 'Unknown';

  // Login page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Sistem Tempahan Bilik AKSM</h1>
          <p className="text-center text-gray-500 mb-8 text-sm">Akademi Kehakiman Syariah Malaysia</p>
          
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
          {/* Kelola Pengguna */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2"><Users size={24} /> Kelola Pengguna</h2>
            
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
                      <td className="px-4 py-2">{editUser === user.ic ? <select value={editUserForm.role} onChange={(e) => setEditUserForm({...editUserForm, role: e.target.value})} className="px-2 py-1 border rounded text-sm"><option value="user">User</option><option value="admin">Admin</option></select> : <span className={editUserForm.role === 'admin' ? 'bg-red-100 text-red-800 px-2 py-1 rounded' : 'bg-blue-100 text-blue-800 px-2 py-1 rounded'}>{user.role}</span>}</td>
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

          {/* Kelola Bilik */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Kelola Bilik</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input type="text" placeholder="Nama bilik" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="px-4 py-2 border rounded" />
              <input type="number" placeholder="Kapasiti" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} className="px-4 py-2 border rounded" />
              <input type="number" placeholder="Harga (RM)" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="px-4 py-2 border rounded" />
              <input type="text" placeholder="Deskripsi" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="px-4 py-2 border rounded" />
            </div>
            
            <button onClick={editRoom ? handleUpdateRoom : handleAddRoom} className="mb-6 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold">
              <Plus size={20} /> {editRoom ? 'Kemaskini Bilik' : 'Tambah Bilik'}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rooms.map(room => (
                <div key={room.id} className="border rounded-lg p-4 hover:shadow-lg transition">
                  <h3 className="font-bold text-lg text-gray-800">{room.name}</h3>
                  <p className="text-sm text-gray-600 mt-2">{room.description}</p>
                  <p className="text-sm mt-2"><span className="font-semibold">Kapasiti:</span> {room.capacity} orang</p>
                  <p className="text-sm"><span className="font-semibold">Harga:</span> RM {room.price}/jam</p>
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
                      <p className="font-semibold">{getRoomName(booking.roomId)}</p>
                      <p className="text-sm text-gray-600">{booking.userName} | {booking.date} {booking.time} | {booking.duration} jam</p>
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
                  <div key={booking.id} className="border rounded-lg p-4 bg-green-50">
                    <p className="font-semibold">{getRoomName(booking.roomId)}</p>
                    <p className="text-sm text-gray-600">{booking.userName} | {booking.date} {booking.time} | {booking.duration} jam</p>
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
        {/* Edit Profil */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Maklumat Profil Saya</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Tempah Bilik */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Tempah Bilik Baru</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <select value={bookingForm.roomId} onChange={(e) => setBookingForm({...bookingForm, roomId: e.target.value})} className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Pilih Bilik</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name} - RM {r.price}/jam</option>)}
            </select>
            <input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})} className="px-4 py-2 border rounded" />
            <input type="time" value={bookingForm.time} onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})} className="px-4 py-2 border rounded" />
            <input type="number" placeholder="Tempoh (jam)" value={bookingForm.duration} onChange={(e) => setBookingForm({...bookingForm, duration: e.target.value})} className="px-4 py-2 border rounded" />
            <button onClick={handleBookRoom} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold">
              Tempah
            </button>
          </div>
        </div>

        {/* Daftar Bilik Tersedia */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Bilik Tersedia</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rooms.map(room => (
              <div key={room.id} className="border rounded-lg p-6 hover:shadow-lg transition">
                <h3 className="font-bold text-xl text-gray-800 mb-2">{room.name}</h3>
                <p className="text-gray-600 mb-3">{room.description}</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Kapasiti:</span> {room.capacity} orang</p>
                  <p><span className="font-semibold">Harga:</span> <span className="text-lg font-bold text-blue-600">RM {room.price}</span>/jam</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tempahan Saya */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Tempahan Saya</h2>
          
          <div className="space-y-4">
            {bookings.filter(b => b.userIC === currentUser.ic).length === 0 ? (
              <p className="text-gray-600">Anda belum membuat sebarang tempahan</p>
            ) : (
              bookings.filter(b => b.userIC === currentUser.ic).map(booking => (
                <div key={booking.id} className={`border rounded-lg p-4 ${booking.status === 'approved' ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{getRoomName(booking.roomId)}</p>
                      <p className="text-gray-600">{booking.date} | {booking.time} | {booking.duration} jam</p>
                      <p className={`text-sm font-semibold mt-2 ${booking.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                        Status: {booking.status === 'approved' ? 'Diluluskan ✓' : 'Menunggu Pengesahan'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}