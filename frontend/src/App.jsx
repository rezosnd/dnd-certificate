import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import VerifyPage from './pages/VerifyPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/verify/:id" element={<VerifyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
