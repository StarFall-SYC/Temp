import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NovelDetail from './pages/NovelDetail';
import NovelRead from './pages/NovelRead';

import NovelEdit from './pages/NovelEdit';
import Navbar from './components/Navbar';
import { useAuthStore } from './store/authStore';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const { checkAuth } = useAuthStore();
  
  // 初始化WebSocket连接
  useWebSocket({
    onConnect: () => {
      console.log('WebSocket已连接');
    },
    onDisconnect: () => {
      console.log('WebSocket已断开');
    },
    onError: (error) => {
      console.error('WebSocket连接错误:', error);
    }
  });

  useEffect(() => {
    // 应用启动时检查认证状态
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/novel/:username/:title" element={<NovelDetail />} />
            <Route path="/read/:username/:title" element={<NovelRead />} />
            <Route path="/read/:username/:title/:chapterNum" element={<NovelRead />} />

            <Route path="/edit/:username/:title" element={<NovelEdit />} />
            <Route path="*" element={<div className="text-center py-20"><h1 className="text-2xl text-gray-600">页面未找到</h1></div>} />
          </Routes>
        </main>
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}

export default App;
