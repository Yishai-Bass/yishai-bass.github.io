import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import Settlements from './pages/Settlements';
import Merchants from './pages/Merchants';
import Login from './pages/Login';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/settlements" element={<Settlements />} />
            <Route path="/merchants" element={<Merchants />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
