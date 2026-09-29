import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingHome from './pages/LandingHome';
import ChartPage from './pages/ChartPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingHome />} />
        <Route path="/chart" element={<ChartPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
