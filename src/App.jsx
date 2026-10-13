import { useState, useEffect } from 'react';
import axios from 'axios';
import CarForm from './components/CarForm';
import CarList from './components/CarList';
import CarDetails from './components/CarDetails';
import AuthPage from './components/AuthPage';
import ChangePassword from './components/ChangePassword';
import { useAuth } from './useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

function App() {
  const { user, token, loading: authLoading, login, logout } = useAuth();
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [editingCar, setEditingCar] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // axios с токеном
  const api = axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const loadCars = async () => {
    if (!token) return;
    try {
      const res = await api.get('/cars');
      setCars(res.data);
      if (!selectedCar && res.data.length > 0) {
        setSelectedCar(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) loadCars();
  }, [token]);

  const handleAddCar = async (car) => {
    await api.post('/cars', car);
    loadCars();
  };

  const handleUpdateCar = async (id, car) => {
    await api.put(`/cars/${id}`, car);
    setEditingCar(null);
    loadCars();
  };

  const handleDeleteCar = async (id) => {
    if (!confirm('Удалить машину и все её записи?')) return;
    await api.delete(`/cars/${id}`);
    if (selectedCar?.id === id) setSelectedCar(null);
    loadCars();
  };

  const handleLogout = () => {
    if (!confirm('Выйти из аккаунта?')) return;
    logout();
    setCars([]);
    setSelectedCar(null);
  };

  // Загрузка
  if (authLoading) {
    return <div className="loading-page">Загрузка...</div>;
  }

  // Не авторизован
  if (!user) {
    return <AuthPage onLogin={login} />;
  }

  // Авторизован
  return (
    <div className="app">
      <header className="app-header">
        <h1>🚗 Мой гараж</h1>
        <div className="user-menu">
          <button
            className="user-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            <span className="user-avatar">{user.username[0]}</span>
            <span className="user-name">{user.username}</span>
            <span className="user-arrow">▾</span>
          </button>

          {showMenu && (
            <>
              <div className="menu-backdrop" onClick={() => setShowMenu(false)} />
              <div className="user-dropdown">
                <button onClick={() => { setShowChangePassword(true); setShowMenu(false); }}>
                  🔒 Сменить пароль
                </button>
                <button onClick={handleLogout} className="danger">
                  🚪 Выйти
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <CarForm
            onSubmit={editingCar ? (data) => handleUpdateCar(editingCar.id, data) : handleAddCar}
            editing={editingCar}
            onCancel={() => setEditingCar(null)}
          />
          <CarList
            cars={cars}
            selectedCar={selectedCar}
            onSelect={setSelectedCar}
            onEdit={setEditingCar}
            onDelete={handleDeleteCar}
          />
        </aside>

        <main className="main">
          {selectedCar ? (
            <CarDetails
              car={selectedCar}
              token={token}
              onBack={() => setSelectedCar(null)}
              onUpdate={loadCars}
            />
          ) : (
            <p className="empty">Выбери машину или добавь новую</p>
          )}
        </main>
      </div>

      {showChangePassword && (
        <ChangePassword token={token} onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}

export default App;