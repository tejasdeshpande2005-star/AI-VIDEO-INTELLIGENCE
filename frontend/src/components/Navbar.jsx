import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="brand-logo">■</span>
        <h1>Warehouse Behaviour Intelligence</h1>
      </div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Dashboard</Link>
      </div>
    </nav>
  );
}
