import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
import api from '../../utils/api';
import { motion } from 'framer-motion';


const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Robust email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address (e.g. name@example.com).' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await api.post('/contact', formData);
      setStatus({ type: 'success', message: 'Message sent successfully! We will get back to you soon.' });

      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus({ type: 'error', message: 'Failed to send message. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 italic-none">
      <div className="max-w-[95%] mx-auto px-6 md:px-10">
        <header className="mb-20 text-center ">
          <h1 className="text-4xl md:text-6xl font-black ">Contact Us</h1>
          <p className="text-gray-400  text-xl mt-4">We are here to help you</p>
          <div className="w-52 mx-auto h-1.5 bg-black mt-5 "></div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Info Side */}
          <div className="space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <a href="mailto:support@gharofethnics.com">
                <div className="p-6 bg-gray-50 rounded-[2rem] space-y-4 border border-gray-100 shadow-md">
                  <div className="w-12 h-12 bg-white mx-auto text-black rounded-full flex items-center justify-center shadow-xl">
                    <Mail size={20} />
                  </div>
                  <div className='text-center'>
                    <h3 className="font-semibold text-gray-500">Email Us</h3>
                    <p className="text-md font-semibold mt-1 break-all"> support@gharofethnics.com</p>
                  </div>
                </div>
              </a>
              <a href="tel:+919845634734" target="_blank" rel="noopener noreferrer">
                <div className="p-6 bg-gray-50 rounded-[2rem] space-y-4 border border-gray-100 shadow-md group">
                  <div className="w-12 h-12 mx-auto bg-white text-black rounded-full flex items-center justify-center shadow-sm group-hover:shadow-xl group-hover:translate-y-[-1px] transition-all duration-700">
                    <p ><Phone size={20} /></p>
                  </div>
                  <div className='flex-col items-center justify-center text-center gap-5'>
                    <h3 className="font-semibold text-lg text-gray-500">Call Us....</h3>
                    <p className="text-md font-semibold mt-1 inline-block h">
                      +91 98456 34734
                    </p>
                  </div>
                </div>
              </a>
            </div>

            <div className="space-y-10">
              <div className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-full shadow-xl border border-gray-100 flex-shrink-0 flex items-center justify-center">
                  <MapPin size={18} className="text-gray-700" />
                </div>
                <div>
                  <h4 className=" font-bold text-orange-500 mb-2">Our Official Address</h4>
                  <p className="text-md font-black">Ghar of Ethnics, 38, Booth no-127, 2nd Main Road, Ashwini layout, Ejipura, Koramangala, Bangalore-560047</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-full shadow-lg border border-gray-100 flex-shrink-0 flex items-center justify-center">
                  <Clock size={18} className="text-gray-700" />
                </div>
                <div>
                  <h4 className=" font-bold text-orange-500 mb-2">Operation Hours</h4>
                  <p className=" ml-2 font-black leading-relaxed uppercase">Mon - Sat: 10:00 AM - 08:30 PM<br />Sun: 11:00 AM - 06:00 PM</p>
                </div>
              </div>
            </div>            
          </div>

          {/* Form Side */}
          <div className="bg-gray-50/50 p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-xl shadow-black/5">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-black">
                <MessageSquare size={20} />
              </div>
              <h2 className="text-3xl font-semibold ">Send a Message</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-gray-600 text-sm font-semibold ml-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-100 px-6 py-5 rounded-2xl outline-none focus:ring-2 ring-black/5 transition-all font-bold text-sm"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-gray-600 text-sm font-semibold ml-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-100 px-6 py-5 rounded-2xl outline-none focus:ring-2 ring-black/5 transition-all font-bold text-sm"
                    placeholder="name@gmail.com"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-gray-600 text-sm font-semibold ml-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-100 px-6 py-5 rounded-2xl outline-none focus:ring-2 ring-black/5 transition-all font-semibold text-sm"
                  placeholder="How can we help?"
                />
              </div>
              <div className="space-y-3">
                <label className="text-gray-600 text-sm font-semibold ml-2">Message</label>
                <textarea
                  name="message"
                  required
                  rows="6"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-100 px-6 py-5 rounded-3xl outline-none focus:ring-2 ring-black/5 transition-all font-bold text-sm resize-none"
                  placeholder="Tell us about your query..."
                ></textarea>
              </div>

              {status.message && (
                <div className={`p-4 rounded-xl text-[0.7rem] font-bold uppercase tracking-widest text-center ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mx-auto  bg-black px-6 text-white group py-5 rounded-full font-semibold shadow-xl hover:shadow-2xl hover: transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Sending...' : (
                  <>
                    Send Message <Send className='group-hover:translate-x-[3px] group-hover:scale-110  transition-all duration-300' size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* New Store Info Section (Map with Floating Card) */}
        {/* <div className="mt-32 relative h-[650px] w-full rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58871.309615744205!2d75.81821072167968!3d22.748420999999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fd57c7b315d5%3A0xe8e1287dffe4c75!2sVikram%20Urbane!5e0!3m2!1sen!2sin!4v1750925944552!5m2!1sen!2sin" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="contrast-125 opacity-80"
          ></iframe>

          <div className="absolute top-1/2 left-6 md:left-12 -translate-y-1/2 bg-white/95 backdrop-blur-md p-10 md:p-14 rounded-[2.5rem] shadow-2xl max-w-[95%] md:max-w-md border border-white/20">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-4xl font-semibold">
                Ghar of Ethnics <br/> Store & Studio
              </h2>
              <p className="text-[0.65rem] md:text-[0.7rem] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                Visit us for a personalized styling session
              </p>
              <div className="pt-4">
                <a 
                  href="https://www.google.com/maps/place/Vikram+Urbane/@22.748421,75.8182107,13z/data=!4m6!3m5!1s0x3962fd57c7b315d5:0xe8e1287dffe4c75!8m2!3d22.748421!4d75.8903085!16s%2Fg%2F1q62k_zmf?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-black text-white px-10 py-4 rounded-full text-[0.65rem] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95"
                >
                  Get Direction
                </a>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Contact;
