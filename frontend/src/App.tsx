import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import DashboardPage from './pages/DashboardPage';
import SubscriptionPage from './pages/SubscriptionPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function SimpleNavigation() {
  return (
    <nav style={{ 
      backgroundColor: '#2c3e50', 
      padding: '15px 20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{ 
          color: '#fff', 
          textDecoration: 'none', 
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          🚀 AI Interview Assistant
        </Link>
        
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <Link to="/pricing" style={{ 
            color: '#ecf0f1', 
            textDecoration: 'none',
            fontSize: '16px',
            transition: 'color 0.3s'
          }}>
            Pricing
          </Link>
          
          <Link to="/dashboard" style={{ 
            color: '#ecf0f1', 
            textDecoration: 'none',
            fontSize: '16px',
            transition: 'color 0.3s'
          }}>
            Dashboard
          </Link>
          
          <Link to="/subscription" style={{ 
            color: '#ecf0f1', 
            textDecoration: 'none',
            fontSize: '16px',
            transition: 'color 0.3s'
          }}>
            Subscription
          </Link>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login">
              <button style={{
                backgroundColor: 'transparent',
                color: '#ecf0f1',
                border: '1px solid #ecf0f1',
                padding: '8px 16px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                Sign In
              </button>
            </Link>
            
            <Link to="/register">
              <button style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                Start Free Trial
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <SimpleNavigation />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;