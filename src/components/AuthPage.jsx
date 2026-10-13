import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' или 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 2) {
      setError('Логин минимум 2 символа');
      return;
    }
    if (!/^\d{4}$/.test(password)) {
      setError('Пароль — ровно 4 цифры');
      return;
    }

    setLoading(true);
    try {
      const url = mode === 'login'
        ? `${API_URL}/auth/login`
        : `${API_URL}/auth/register`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Что-то пошло не так');
        setLoading(false);
        return;
      }

      onLogin(data.token, data.user);
    } catch (err) {
      setError('Ошибка соединения');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">🚗 Мой гараж</h1>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Вход
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Логин
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              maxLength={30}
              autoComplete="username"
              required
            />
          </label>

          <label className="auth-label">
            Пароль (4 цифры)
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              maxLength={4}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {error && <div className="auth-error">⚠️ {error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Загрузка...' : (mode === 'login' ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;