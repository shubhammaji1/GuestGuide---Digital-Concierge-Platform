import { Routes, Route } from 'react-router-dom';
import GuestApp from './pages/GuestApp';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { useAuthStore } from './store/authStore';

function App() {
  const { token } = useAuthStore();

  return (
    <Routes>
      {/* Guest routes (public) */}
      <Route path="/" element={<GuestApp />} />
      <Route path="/hotel/:slug" element={<GuestApp />} />
      
      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route 
        path="/admin/*" 
        element={token ? <AdminDashboard /> : <AdminLogin />} 
      />
    </Routes>
  );
}

export default App;

