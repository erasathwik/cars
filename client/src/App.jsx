import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { PostItem } from './pages/PostItem';
import { YourPosts } from './pages/YourPosts';
import { Claims } from './pages/Claims';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();

  return (
    <div className="container">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Auth />} />
        
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/post-item" element={<ProtectedRoute><PostItem /></ProtectedRoute>} />
        <Route path="/your-posts" element={<ProtectedRoute><YourPosts /></ProtectedRoute>} />
        <Route path="/claims" element={<ProtectedRoute><Claims /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
