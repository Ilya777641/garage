import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

function ChangePassword({ token, onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{4}$/.test(oldPassword)) {
      setError('Старый пароль — 4 цифры');
      return;
    }
    if (!/^\d{4}$/.test(newPassword)) {
      setError('Новый пароль — 4 цифры');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError('Ошибка соединения');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>🔒 Смена пароля</h2>

        {success ? (
          <div className="modal-success">✅ Пароль изменён!</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="auth-label">
              Старый пароль
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                maxLength={4}
                required
              />
            </label>

            <label className="auth-label">
              Новый пароль
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                maxLength={4}
                required
              />
            </label>

            {error && <div className="auth-error">⚠️ {error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Сохраняю...' : 'Сменить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ChangePassword;