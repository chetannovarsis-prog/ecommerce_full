import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Package, MapPin, ChevronRight, ShoppingBag, Plus, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const emptyAddress = {
  label: '',
  firstName: '',
  lastName: '',
  address: '',
  apartment: '',
  city: '',
  state: '',
  pinCode: '',
  phone: ''
};

const Profile = () => {
  const [customer, setCustomer] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', gender: '', email: '', mobile: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileErrors, setProfileErrors] = useState({});
  const [otpSession, setOtpSession] = useState(null);
  const [profileOtp, setProfileOtp] = useState({ emailOtp: '', mobileOtp: '' });
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [addressErrors, setAddressErrors] = useState({});
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer');
    if (!savedCustomer) {
      navigate('/login');
      return;
    }

    const parsedCustomer = JSON.parse(savedCustomer);
    setCustomer(parsedCustomer);
    fetchProfile(parsedCustomer.id);
    fetchOrders(parsedCustomer.id);
  }, [navigate]);

  const fetchProfile = async (customerId) => {
    try {
      const res = await api.get(`/auth/customer/${customerId}/profile`);
      const nextCustomer = res.data.customer;
      setCustomer(prev => ({ ...prev, ...nextCustomer }));
      setProfileForm({
        name: nextCustomer.name || '',
        gender: nextCustomer.gender || '',
        email: nextCustomer.email || '',
        mobile: nextCustomer.mobile || ''
      });
      setAddresses(nextCustomer.addresses || []);
      localStorage.setItem('customer', JSON.stringify({
        ...JSON.parse(localStorage.getItem('customer') || '{}'),
        ...nextCustomer
      }));
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const persistCustomer = (nextCustomer) => {
    setCustomer(nextCustomer);
    localStorage.setItem('customer', JSON.stringify({
      ...JSON.parse(localStorage.getItem('customer') || '{}'),
      ...nextCustomer
    }));
  };

  const fetchOrders = async (customerId) => {
    try {
      const res = await api.get(`/orders/customer/${customerId}`);
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation
    const errors = { ...addressErrors };
    
    if (name === 'firstName') {
      if (!value.trim()) {
        errors.firstName = 'First name is required';
      } else if (value.trim().length < 2) {
        errors.firstName = 'First name must be at least 2 characters';
      } else {
        delete errors.firstName;
      }
    } else if (name === 'lastName') {
      if (!value.trim()) {
        errors.lastName = 'Last name is required';
      } else {
        delete errors.lastName;
      }
    } else if (name === 'address') {
      if (!value.trim()) {
        errors.address = 'Address is required';
      } else if (value.trim().length < 10) {
        errors.address = 'Address must be at least 10 characters';
      } else {
        delete errors.address;
      }
    } else if (name === 'city') {
      if (!value.trim()) {
        errors.city = 'City is required';
      } else {
        delete errors.city;
      }
    } else if (name === 'state') {
      if (!value.trim()) {
        errors.state = 'State is required';
      } else {
        delete errors.state;
      }
    } else if (name === 'pinCode') {
      if (!value.trim()) {
        errors.pinCode = 'PIN code is required';
      } else if (!/^[1-9][0-9]{5}$/.test(value.trim())) {
        errors.pinCode = 'Please enter a valid 6-digit PIN code';
      } else {
        delete errors.pinCode;
      }
    } else if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setAddressForm(prev => ({ ...prev, phone: cleaned }));
      if (!cleaned) {
        errors.phone = 'Phone number is required';
      } else if (!/^[6-9]\d{9}$/.test(cleaned)) {
        errors.phone = 'Please enter a valid 10-digit phone number starting with 6-9';
      } else {
        delete errors.phone;
      }
    }
    
    setAddressErrors(errors);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!customer?.id) return;

    if (!validateAddressForm()) {
      setAddressMessage('Please fix the errors below');
      return;
    }

    setSavingAddress(true);
    setAddressMessage('');

    try {
      const nextAddresses = [
        ...addresses,
        {
          id: `addr_${Date.now()}`,
          label: addressForm.label.trim() || `Address ${addresses.length + 1}`,
          firstName: addressForm.firstName.trim(),
          lastName: addressForm.lastName.trim(),
          email: customer.email,
          address: addressForm.address.trim(),
          apartment: addressForm.apartment.trim(),
          city: addressForm.city.trim(),
          state: addressForm.state.trim(),
          pinCode: addressForm.pinCode.trim(),
          phone: addressForm.phone.trim()
        }
      ];

      const res = await api.put(`/auth/customer/${customer.id}/addresses`, {
        addresses: nextAddresses
      });

      setAddresses(res.data.customer.addresses || []);
      const nextCustomer = { ...customer, addresses: res.data.customer.addresses || [] };
      setCustomer(nextCustomer);
      localStorage.setItem('customer', JSON.stringify(nextCustomer));
      setAddressForm(emptyAddress);
      setAddressErrors({});
      setShowAddressForm(false);
      setAddressMessage('Address saved successfully.');
    } catch (err) {
      console.error('Error saving address:', err);
      setAddressMessage('Could not save address. Please try again.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customer');
    navigate('/login');
  };

  const validateProfileForm = () => {
    const errors = {};
    
    if (!profileForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (profileForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(profileForm.name.trim())) {
      errors.name = 'Name can only contain letters';
    }

    if (profileForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (profileForm.mobile.trim() && !/^[6-9]\d{9}$/.test(profileForm.mobile.trim())) {
      errors.mobile = 'Please enter a valid 10-digit phone number starting with 6-9';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAddressForm = () => {
    const errors = {};
    
    if (!addressForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (addressForm.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!addressForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!addressForm.address.trim()) {
      errors.address = 'Address is required';
    } else if (addressForm.address.trim().length < 10) {
      errors.address = 'Address must be at least 10 characters';
    }

    if (!addressForm.city.trim()) {
      errors.city = 'City is required';
    }

    if (!addressForm.state.trim()) {
      errors.state = 'State is required';
    }

    if (!addressForm.pinCode.trim()) {
      errors.pinCode = 'PIN code is required';
    } else if (!/^[1-9][0-9]{5}$/.test(addressForm.pinCode.trim())) {
      errors.pinCode = 'Please enter a valid 6-digit PIN code';
    }

    if (!addressForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(addressForm.phone.trim())) {
      errors.phone = 'Please enter a valid 10-digit phone number starting with 6-9';
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

 

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setProfileForm((prev) => ({ ...prev, [name]: cleaned }));
      
      // Real-time validation
      if (cleaned && !/^[6-9]\d{9}$/.test(cleaned)) {
        setProfileErrors((prev) => ({ ...prev, mobile: 'Please enter a valid 10-digit phone number starting with 6-9' }));
      } else {
        setProfileErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.mobile;
          return newErrors;
        });
      }
      return;
    }
    
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    
    // Real-time validation
    const errors = { ...profileErrors };
    if (name === 'name') {
      if (!value.trim()) {
        errors.name = 'Name is required';
      } else if (value.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
        errors.name = 'Name can only contain letters';
      } else {
        delete errors.name;
      }
    } else if (name === 'email') {
      if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        errors.email = 'Please enter a valid email address';
      } else {
        delete errors.email;
      }
    }
    setProfileErrors(errors);
  };

  const handleSaveProfile = async () => {
    if (!customer?.id) return;
    
    if (!validateProfileForm()) {
      setProfileMessage('Please fix the errors below');
      return;
    }
    
    setSavingProfile(true);
    setProfileMessage('');

    try {
      const payload = {
        name: profileForm.name.trim() || null,
        gender: profileForm.gender || null,
        email: profileForm.email.trim() || null,
        mobile: profileForm.mobile.trim() || null
      };

      const res = await api.post(`/auth/customer/${customer.id}/profile/request-update`, payload);
      if (res.data?.requiresOtp) {
        setOtpSession({
          verificationToken: res.data.verificationToken,
          requireEmailOtp: !!res.data.requireEmailOtp,
          requireMobileOtp: !!res.data.requireMobileOtp
        });
        setProfileOtp({ emailOtp: '', mobileOtp: '' });
        setProfileMessage('OTP sent. Verify to complete profile update.');
        return;
      }

      if (res.data?.customer) {
        persistCustomer({ ...customer, ...res.data.customer });
        setProfileForm({
          name: res.data.customer.name || '',
          gender: res.data.customer.gender || '',
          email: res.data.customer.email || '',
          mobile: res.data.customer.mobile || ''
        });
      }

      setEditingProfile(false);
      setProfileErrors({});
      setProfileMessage(res.data?.message || 'Profile updated successfully.');
    } catch (err) {
      setProfileMessage(err.response?.data?.message || 'Could not update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleVerifyProfileOtp = async () => {
    if (!otpSession || !customer?.id) return;
    setSavingProfile(true);
    setProfileMessage('');

    try {
      const res = await api.post(`/auth/customer/${customer.id}/profile/verify-update`, {
        verificationToken: otpSession.verificationToken,
        emailOtp: profileOtp.emailOtp.trim() || undefined,
        mobileOtp: profileOtp.mobileOtp.trim() || undefined
      });

      if (res.data?.customer) {
        persistCustomer({ ...customer, ...res.data.customer });
        setProfileForm({
          name: res.data.customer.name || '',
          gender: res.data.customer.gender || '',
          email: res.data.customer.email || '',
          mobile: res.data.customer.mobile || ''
        });
      }

      setOtpSession(null);
      setEditingProfile(false);
      setProfileMessage('Profile updated successfully.');
    } catch (err) {
      setProfileMessage(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-6 italic-none">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start justify-between">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-white text-3xl font-black ring-8 ring-white shadow-xl">
              {customer.name?.charAt(0) || 'U'}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black">{customer.name}</h1>
              <p className="text-gray-400 font-semibold">{customer.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-8 py-3 bg-white border border-gray-100 rounded-xl text-[0.65rem] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            { icon: <Package size={20} />, label: 'Order History', count: `${orders.length} Orders` },
            { icon: <MapPin size={20} />, label: 'Addresses', count: `${addresses.length} Saved` },
            // { icon: <Settings size={20} />, label: 'Preferences', count: 'Updated' }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4 cursor-pointer group"
            >
              <div className="p-3 bg-gray-50 rounded-2xl w-fit group-hover:bg-black group-hover:text-white transition-colors">{item.icon}</div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-tight">{item.label}</h3>
                <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">{item.count}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
          <div className="flex items-center justify-between p-8 border-b">
            <h2 className="text-xl font-black">Personal Information</h2>
            <button
              type="button"
              onClick={() => {
                setEditingProfile((prev) => !prev);
                setProfileMessage('');
                setOtpSession(null);
              }}
              className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-black"
            >
              {editingProfile ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">Name</label>
              <input
                name="name"
                value={profileForm.name}
                onChange={handleProfileInputChange}
                disabled={!editingProfile}
                className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-black disabled:bg-gray-100 ${
                  profileErrors.name ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                }`}
                placeholder="Your name"
              />
              {profileErrors.name && <p className="text-xs text-red-500 font-semibold">{profileErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">Gender</label>
              <select
                name="gender"
                value={profileForm.gender}
                onChange={handleProfileInputChange}
                disabled={!editingProfile}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-black disabled:bg-gray-100"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">Email</label>
              <input
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileInputChange}
                disabled={!editingProfile}
                className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-black disabled:bg-gray-100 ${
                  profileErrors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                }`}
                placeholder="Email address"
              />
              {profileErrors.email && <p className="text-xs text-red-500 font-semibold">{profileErrors.email}</p>}
            </div>
            {/* <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">Mobile Number</label>
              <input
                name="mobile"
                type="text"
                inputMode="numeric"
                value={profileForm.mobile}
                onChange={handleProfileInputChange}
                disabled={!editingProfile}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-black disabled:bg-gray-100"
                placeholder="10-digit mobile number"
              />
            </div> */}
          </div>

          {editingProfile && (
            <div className="px-8 pb-8 space-y-4">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="rounded-xl bg-black text-white px-6 py-3 text-[0.72rem] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>

              {otpSession && (
                <div className="rounded-2xl border border-gray-200 p-4 space-y-3 bg-gray-50">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Verify OTP to update email/mobile</p>
                  {otpSession.requireEmailOtp && (
                    <input
                      type="text"
                      value={profileOtp.emailOtp}
                      onChange={(e) => setProfileOtp((prev) => ({ ...prev, emailOtp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      placeholder="Enter email OTP"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-black"
                    />
                  )}
                  {otpSession.requireMobileOtp && (
                    <input
                      type="text"
                      value={profileOtp.mobileOtp}
                      onChange={(e) => setProfileOtp((prev) => ({ ...prev, mobileOtp: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      placeholder="Enter mobile OTP"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-black"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleVerifyProfileOtp}
                    disabled={savingProfile}
                    className="rounded-xl bg-black text-white px-6 py-3 text-[0.72rem] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-50"
                  >
                    {savingProfile ? 'Verifying...' : 'Verify OTP & Update'}
                  </button>
                </div>
              )}

              {profileMessage && (
                <p className={`text-sm font-semibold ${profileMessage.toLowerCase().includes('success') || profileMessage.toLowerCase().includes('otp sent') ? 'text-emerald-600' : 'text-red-600'}`}>
                  {profileMessage}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
            <div className="flex items-center justify-center p-10 pb-4 border-b">
              <h2 className=" text-lg font-bold  t">Saved Addresses</h2>
            </div>

            <div className="p-8 space-y-5">
              {addresses.length > 0 ? (
                addresses.map((address) => (
                  <div key={address.id} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black uppercase tracking-tight">{address.label || 'Saved Address'}</p>
                      <span className="text-[0.6rem] font-bold uppercase tracking-widest text-emerald-600">Ready for Checkout</span>
                    </div>
                    <p className="text-sm font-semibold">{address.firstName} {address.lastName}</p>
                    <p className="text-sm text-gray-600">{address.address}</p>
                    {address.apartment && <p className="text-sm text-gray-600">{address.apartment}</p>}
                    <p className="text-sm text-gray-600">{address.city}, {address.state} {address.pinCode}</p>
                    <p className="text-sm text-gray-600">{address.phone}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                  <MapPin size={28} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-[0.7rem] font-black uppercase tracking-widest text-gray-400">No saved addresses yet</p>
                  <p className="text-sm text-gray-500 mt-2">Add one below and it will be available during checkout.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
            <div className="flex items-center justify-between p-10 pb-4 border-b">
              <h2 className="text-lg font-bold ">Add Address</h2>
              <button
                type="button"
                onClick={() => {
                  setShowAddressForm(prev => !prev);
                  setAddressMessage('');
                }}
                className="rounded-full bg-black text-white px-5 py-3 text-sm font-semibold hover:bg-zinc-800 transition-all flex items-center gap-2"
              >
                <Plus size={16} />
                {showAddressForm ? 'Close' : 'Add Address'}
              </button>
            </div>

            {showAddressForm && (
              <form onSubmit={handleSaveAddress} className="p-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">Address Label</label>
                  <input name="label" value={addressForm.label} onChange={handleAddressInputChange} placeholder="Home, Office, Studio..." className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-black" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <input name="firstName" value={addressForm.firstName} onChange={handleAddressInputChange} placeholder="First name" className={`rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-black w-full ${addressErrors.firstName ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`} required />
                    {addressErrors.firstName && <p className="text-xs text-red-500 font-semibold">{addressErrors.firstName}</p>}
                  </div>
                  <div className="space-y-1">
                    <input name="lastName" value={addressForm.lastName} onChange={handleAddressInputChange} placeholder="Last name" className={`rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-black w-full ${addressErrors.lastName ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`} required />
                    {addressErrors.lastName && <p className="text-xs text-red-500 font-semibold">{addressErrors.lastName}</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <input name="address" value={addressForm.address} onChange={handleAddressInputChange} placeholder="Address" className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-black ${addressErrors.address ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`} required />
                  {addressErrors.address && <p className="text-xs text-red-500 font-semibold">{addressErrors.address}</p>}
                </div>
                <input name="apartment" value={addressForm.apartment} onChange={handleAddressInputChange} placeholder="Apartment, suite, etc. (optional)" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-black" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <input name="city" value={addressForm.city} onChange={handleAddressInputChange} placeholder="City" className={`rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-black w-full ${addressErrors.city ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`} required />
                    {addressErrors.city && <p className="text-xs text-red-500 font-semibold">{addressErrors.city}</p>}
                  </div>
                  <div className="space-y-1">
                    <input name="state" value={addressForm.state} onChange={handleAddressInputChange} placeholder="State" className={`rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-black w-full ${addressErrors.state ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`} required />
                    {addressErrors.state && <p className="text-xs text-red-500 font-semibold">{addressErrors.state}</p>}
                  </div>
                  <div className="space-y-1">
                    <input name="pinCode" value={addressForm.pinCode} onChange={handleAddressInputChange} placeholder="PIN code" className={`rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-black w-full ${addressErrors.pinCode ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`} required />
                    {addressErrors.pinCode && <p className="text-xs text-red-500 font-semibold">{addressErrors.pinCode}</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <input name="phone" value={addressForm.phone} onChange={handleAddressInputChange} placeholder="Phone" className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-black ${addressErrors.phone ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`} required />
                  {addressErrors.phone && <p className="text-xs text-red-500 font-semibold">{addressErrors.phone}</p>}
                </div>

                {addressMessage && (
                  <p className={`text-sm font-semibold ${addressMessage.includes('successfully') ? 'text-emerald-600' : 'text-red-600'}`}>
                    {addressMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingAddress}
                  className="w-full rounded-xl bg-black text-white py-4 text-[0.72rem] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingAddress ? 'Saving...' : <><Plus size={16} /><Save size={16} /> Save Address</>}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
          <div className="flex items-center justify-center p-10 pb-4 border-b">
            <h2 className="text-2xl font-bold">Recent Activity</h2>
          </div>

          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-20 text-center flex justify-center">
                <div className="w-8 h-8 border-t-2 border-black rounded-full animate-spin"></div>
              </div>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block p-8 hover:bg-gray-50/60 transition-colors group"
                >
                  <div className="flex justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                        <ShoppingBag size={24} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight">Order #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900 tracking-tight italic">Rs {order.totalAmount}</p>
                        <span className={`text-[0.6rem] px-2 py-1 rounded-md font-black uppercase tracking-widest ${
                          order.status === 'PAID' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                  <Package size={24} className="text-gray-300" />
                </div>
                <p className="text-[0.65rem] text-gray-400 font-black uppercase tracking-[3px]">No recent orders found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
