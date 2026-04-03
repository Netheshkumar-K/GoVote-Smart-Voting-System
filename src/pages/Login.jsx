import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import emailjs from '@emailjs/browser';

const Login = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP State
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [sentEmailOtp, setSentEmailOtp] = useState('');
  
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = (e) => {
    e.preventDefault();
    if (!email || !phone) return setError("Email and Phone are required.");
    setError('');
    setLoading(true);
    
    // Generate OTP
    setTimeout(async () => {
      const generatedEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      setSentEmailOtp(generatedEmailOtp);
      
      // Real Backend Email Dispatch using EmailJS
      try {
        await emailjs.send(
          'service_tz7doac',   // <-- Successfully authenticated with your Gmail Service ID
          'template_omqtvnl',  // <-- Successfully authenticated with your EmailJS Template ID
          {
            email: email,             // Matches {{email}} in your EmailJS template
            passcode: generatedEmailOtp // Matches {{passcode}} in your EmailJS template
          },
          'Y1xrAkRxO0qvulxk1'    // <-- Successfully authenticated with your Public Key
        );
        console.log(`✅ [NETWORK DISPATCH]: Email OTP (${generatedEmailOtp}) delivered to ${email}!`);
      } catch (err) {
        console.error('[EMAILJS ERROR]:', err);
        alert('Failed to send real email. Have you replaced the YOUR_SERVICE_ID, YOUR_TEMPLATE_ID, and YOUR_PUBLIC_KEY in Login.jsx?');
      }



      setStep(2);
      setLoading(false);
    }, 1000);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (emailOtpInput !== sentEmailOtp) {
      setLoading(false);
      return setError('Invalid Email OTP. Verification blocked.');
    }
    
    try {
      await login(email, phone);
    } catch (err) {
      setError('Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="card">
        <div className="auth-header">
          <h1>Welcome to GoVote</h1>
          <p className="text-secondary">
            Secure One-Time Password verification access.
          </p>
        </div>

        {error && <div className="form-group" style={{ color: 'var(--danger-color)' }}>{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOTP}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                className="form-control"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              <LogIn size={20} />
              {loading ? 'Sending OTP...' : 'Send Login OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label className="form-label" htmlFor="email-otp">✉️ Enter Email Verification OTP</label>
              <input
                type="text"
                id="email-otp"
                className="form-control"
                placeholder="000000"
                value={emailOtpInput}
                onChange={(e) => setEmailOtpInput(e.target.value)}
                required
                maxLength="6"
                style={{ letterSpacing: '0.5rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              <LogIn size={20} />
              {loading ? 'Verifying Tokens...' : 'Verify Secure Email & Login'}
            </button>
            <button type="button" className="btn btn-secondary btn-block" style={{ marginTop: '0.5rem' }} onClick={() => setStep(1)} disabled={loading}>
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
