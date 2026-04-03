import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Vote, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <Vote className="logo-icon" size={28} />
          Electra
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              <span className="nav-link" style={{ cursor: 'default' }}>
                {user.email} ({user.role})
              </span>
              <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.4rem 1rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
