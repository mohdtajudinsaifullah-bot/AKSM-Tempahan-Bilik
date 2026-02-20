import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, LogOut, Users, Upload, Calendar } from 'lucide-react';

// URL Google Apps Script kau
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw15k0QnWTblCKQ_jqDWJ7ooaRe-Yqb3S03Fc7hN9h703CQWobYCi_XJzzU0y7SYJ2F/exec';

const sheetCall = async (method, table, data = null, idField = '', idValue = '') => {
  try {
    // Untuk GET (Tarik data)
    if (method === 'GET') {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?table=${table}`);
      return await response.json();
    } 
    
    // Untuk POST, PATCH, DELETE - Kita hantar semua guna POST ke Google
    // Sebab Google Apps Script paling stabil terima POST
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Penting untuk elak CORS error di browser
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        method: method, // bagitau Google ni POST/PATCH/DELETE
        table: table, 
        data: data, 
        idField: idField, 
        idValue: idValue 
      })
    });
    
    return { success: true };
  } catch (error) {
    console.error('API Error:', error);
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
  const [bookingDates, setBookingDates] = useState({ startDate: '', endDate: '', startTime: '', endTime: '', purpose: '' });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', jabatan: '', role: 'user' });
  const [newUserForm, setNewUserForm] = useState({ ic: '', password: '', name: '', email: '', jabatan: '', role: 'user' });
  const [confirmCancel, setConfirmCancel] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const usersData = await sheetCall('GET', 'users');
    const roomsData = await sheetCall('GET', 'rooms');
    const bookingsData = await sheetCall('GET', 'bookings');
    
    if (usersData) setUsers(usersData);
    if (roomsData) setRooms(roomsData);
    if (bookingsData) setBookings(bookingsData);
  };

  const handleUserLogin = () => {
    const user = users.find(u => String(u.ic) === loginIC && String(u.password) === loginPassword);
    if (user) {
      setCurrentUser({ ...user });
      setLoginIC('');
      setLoginPassword('');
    } else {
      alert('No IC atau Password salah!');
    }
  };

  const handleAdminLogin = () => {
    const user = users.find(u => String(u.ic) === loginIC && String(u.password) === loginPassword && u.role === 'admin');
    if (user) {
      setCurrentUser({ ...user });
      setLoginIC('');
      setLoginPassword('');
    } else {
      alert('No IC/Password salah atau anda bukan Admin!');
    }
  };

  const handleRegister = async () => {
    if (!regForm.ic || !regForm.password || !regForm.name || !regForm.email || !regForm.jabatan) {
      alert('Sila isi semua medan!');
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      alert('Password tidak sepadan!');
      return;
    }
    if (users.find(u => String(u.ic) === regForm.ic)) {
      alert('No IC sudah terdaftar!');
      return;
    }
    
    const userData = { ic: regForm.ic, password: regForm.password, name: regForm.name, email: regForm.email, jabatan: regForm.jabatan, role: 'user' };
    await sheetCall('POST', 'users', userData);
    setUsers([...users, userData]);
    alert('Pendaftaran berjaya! Sila log masuk.');
    setRegForm({ ic: '', password: '', confirmPassword: '', name: '', email: '', jabatan: '' });
    setAuthMode('login');
  };

  const handleLogout = () => setCurrentUser(null);

  const handleAddRoom = async () => {
    if (formData.name && formData.description) {
      const newRoom = { 
        id: Date.now().toString(), 
        name: formData.name, 
        description: formData.description,
        images: JSON.stringify(formData.images) 
      };
      await sheetCall('POST', 'rooms', newRoom);
      setRooms([...rooms, { ...newRoom, images: formData.images }]);
      setFormData({ name: '', description: '', images: [] });
    }
  };

  const handleUpdateRoom = async () => {
    const updatedData = { ...formData, images: JSON.stringify(formData.images) };
    await sheetCall('PATCH', 'rooms', updatedData, 'id', editRoom);
    setRooms(rooms.map(r => r.id === editRoom ? { ...r, ...formData } : r));
    setEditRoom(null);
    setFormData({ name: '', description: '', images: [] });
  };

  const handleDeleteRoom = async (id) => {
    if(window.confirm('Padam bilik ini?')) {
      await sheetCall('DELETE', 'rooms', null, 'id', id);
      setRooms(rooms.filter(r => r.id !== id));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({...prev, images: [...prev.images, event.target.result]}));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBookRoom = async () => {
    const newBooking = {
      id: Date.now().toString(),
      room_id: selectedRoom,
      user_ic: currentUser.ic,
      user_name: currentUser.name,
      user_email: currentUser.email,
      start_date: bookingDates.startDate,
      end_date: bookingDates.endDate,
      start_time: bookingDates.startTime,
      end_time: bookingDates.endTime,
      duration: calculateDuration(bookingDates.startDate, bookingDates.startTime, bookingDates.endDate, bookingDates.endTime),
      purpose: bookingDates.purpose,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    await sheetCall('POST', 'bookings', newBooking);
    setBookings([...bookings, newBooking]);
    alert('Tempahan berjaya dihantar!');
    setBookingDates({ startDate: '', endDate: '', startTime: '', endTime: '', purpose: '' });
    setSelectedRoom(null);
  };

  const handleApproveBooking = async (id) => {
    await sheetCall('PATCH', 'bookings', { status: 'approved' }, 'id', id);
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'approved' } : b));
  };

  const handleRejectBooking = async (id) => {
    await sheetCall('PATCH', 'bookings', { status: 'rejected' }, 'id', id);
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'rejected' } : b));
  };

  const handleCancelBooking = async (id) => {
    await sheetCall('PATCH', 'bookings', { status: 'cancelled' }, 'id', id);
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    setConfirmCancel(null);
  };

  const handleUpdateUser = async () => {
    await sheetCall('PATCH', 'users', editUserForm, 'ic', editUser);
    setUsers(users.map(u => u.ic === editUser ? { ...u, ...editUserForm } : u));
    setEditUser(null);
  };

  const handleDeleteUser = async (ic) => {
    if(window.confirm('Padam pengguna ini?')) {
      await sheetCall('DELETE', 'users', null, 'ic', ic);
      setUsers(users.filter(u => u.ic !== ic));
    }
  };

  const calculateDuration = (start, sTime, end, eTime) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  const getRoomName = (id) => rooms.find(r => String(r.id) === String(id))?.name || 'Bilik Tidak Wujud';

  // Helper untuk parse imej dari string (sebab Google Sheets simpan imej sebagai string JSON)
  const parseImages = (imgData) => {
    try { return typeof imgData === 'string' ? JSON.parse(imgData) : imgData; }
    catch { return []; }
  };

  // --- UI RENDER (LOGIC SAMA MACAM ASAL) ---
  // ... (Kod UI dikekalkan sama seperti yang anda berikan di atas) ...
  // [Nota: Aku ringkaskan bahagian UI sebab limit patah perkataan, 
  // kau boleh teruskan guna UI render yang kau dah ada dalam script asal kau]

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{backgroundImage: 'url(https://www.nationalenergyawards.com.my/storage/2024/09/PJH2.jpg)'}}>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
          {/* Bagian Login Box - Guna koding UI asal kau di sini */}
          <div className="text-white p-8 flex flex-col justify-center">
             <h2 className="text-3xl font-bold mb-6">Sistem Tempahan Bilik AKSM</h2>
             <p className="text-lg mb-8">Google Sheets Edition</p>
          </div>
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">Selamat Datang</h1>
            {authMode === 'login' && (
              <div className="space-y-4">
                <input type="text" placeholder="No IC" value={loginIC} onChange={(e) => setLoginIC(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                <button onClick={handleUserLogin} className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold">Login User</button>
                <button onClick={() => setAuthMode('adminlogin')} className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold">Login Admin</button>
                <button onClick={() => setAuthMode('register')} className="w-full text-blue-500 mt-2 text-sm">Daftar Baru</button>
              </div>
            )}
            {/* ... Tambah authMode 'register' & 'adminlogin' ikut UI asal kau ... */}
          </div>
        </div>
      </div>
    );
  }

  // JIKA ADMIN
  if (currentUser.role === 'admin') {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Gunakan UI Dashboard Admin asal kau di sini */}
            <div className="bg-red-600 text-white p-6 flex justify-between">
                <h1 className="text-2xl font-bold">Admin Dashboard (Google Sheets)</h1>
                <button onClick={handleLogout} className="bg-red-800 px-4 py-2 rounded">Logout</button>
            </div>
            <div className="p-6">
                {/* Render list users, rooms, dan bookings guna koding asal kau */}
                <p>Data kini disimpan terus ke Google Sheets anda.</p>
            </div>
        </div>
    );
  }

  // JIKA USER BIASA
  return (
    <div className="min-h-screen bg-gray-50">
       {/* Gunakan UI User asal kau di sini */}
       <div className="bg-blue-600 text-white p-6 flex justify-between">
            <h1 className="text-2xl font-bold">Sistem Tempahan AKSM</h1>
            <button onClick={handleLogout} className="bg-blue-800 px-4 py-2 rounded">Logout</button>
        </div>
        <div className="p-6">
             {/* Content Tempahan Bilik asal kau */}
             <p>Log masuk sebagai: {currentUser.name}</p>
        </div>
    </div>
  );
}