require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://garage-ilya.netlify.app',
    'https://garage.my-money.site',
  ],
  credentials: false,
}));

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ============================================================
// JWT
// ============================================================
const JWT_SECRET = process.env.JWT_SECRET || 'garage-super-secret-key-change-me';
const JWT_EXPIRES = '7d';

// ============================================================
// MIDDLEWARE — проверка токена
// ============================================================
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Токен недействителен' });
  }
}

// ============================================================
// АУТЕНТИФИКАЦИЯ
// ============================================================

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Валидация
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ error: 'Логин минимум 2 символа' });
    }
    if (!password || !/^\d{4}$/.test(password)) {
      return res.status(400).json({ error: 'Пароль — ровно 4 цифры' });
    }

    // Проверка занятости логина
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username.trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Такой логин уже занят' });
    }

    // Хешируем пароль
    const hash = await bcrypt.hash(password, 10);

    // Создаём пользователя
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username.trim(), hash]
    );

    const user = result.rows[0];

    // Выдаём токен
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Введите логин и пароль' });
    }

    const result = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

// Получить текущего пользователя
app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка' });
  }
});

// Смена пароля
app.post('/api/auth/change-password', authRequired, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Введите старый и новый пароль' });
    }
    if (!/^\d{4}$/.test(newPassword)) {
      return res.status(400).json({ error: 'Новый пароль — ровно 4 цифры' });
    }

    // Получаем текущий хеш
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const match = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Старый пароль неверный' });
    }

    // Обновляем
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, req.userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка смены пароля' });
  }
});

// ============================================================
// МАШИНЫ (только свои)
// ============================================================

// Получить все машины пользователя
app.get('/api/cars', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cars WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
});

// Добавить машину
app.post('/api/cars', authRequired, async (req, res) => {
  try {
    const { name, year, mileage } = req.body;
    const result = await pool.query(
      'INSERT INTO cars (name, year, mileage, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, year, mileage || 0, req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

// Обновить машину
app.put('/api/cars/:id', authRequired, async (req, res) => {
  try {
    const { name, year, mileage } = req.body;
    const result = await pool.query(
      'UPDATE cars SET name = $1, year = $2, mileage = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [name, year, mileage, req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Машина не найдена' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// Удалить машину
app.delete('/api/cars/:id', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM cars WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Машина не найдена' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

// ============================================================
// ТО (проверяем, что машина принадлежит пользователю)
// ============================================================

// Получить ТО для машины
app.get('/api/maintenance/:carId', authRequired, async (req, res) => {
  try {
    // Проверяем, что машина принадлежит пользователю
    const ownerCheck = await pool.query(
      'SELECT id FROM cars WHERE id = $1 AND user_id = $2',
      [req.params.carId, req.userId]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    const result = await pool.query(
      'SELECT * FROM maintenance WHERE car_id = $1 ORDER BY date DESC',
      [req.params.carId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
});

// Добавить ТО
app.post('/api/maintenance', authRequired, async (req, res) => {
  try {
    const { car_id, date, mileage, description, cost } = req.body;

    // Проверяем, что машина принадлежит пользователю
    const ownerCheck = await pool.query(
      'SELECT id FROM cars WHERE id = $1 AND user_id = $2',
      [car_id, req.userId]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    const result = await pool.query(
      'INSERT INTO maintenance (car_id, date, mileage, description, cost) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [car_id, date, mileage, description, cost || 0]
    );

    if (mileage) {
      await pool.query(
        'UPDATE cars SET mileage = $1 WHERE id = $2 AND mileage < $1',
        [mileage, car_id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

// Обновить ТО
app.put('/api/maintenance/:id', authRequired, async (req, res) => {
  try {
    const { date, mileage, description, cost } = req.body;

    // Проверяем, что запись принадлежит пользователю (через машину)
    const ownerCheck = await pool.query(
      `SELECT m.id FROM maintenance m
       JOIN cars c ON c.id = m.car_id
       WHERE m.id = $1 AND c.user_id = $2`,
      [req.params.id, req.userId]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    const result = await pool.query(
      'UPDATE maintenance SET date = $1, mileage = $2, description = $3, cost = $4 WHERE id = $5 RETURNING *',
      [date, mileage, description, cost || 0, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// Удалить ТО
app.delete('/api/maintenance/:id', authRequired, async (req, res) => {
  try {
    const ownerCheck = await pool.query(
      `SELECT m.id FROM maintenance m
       JOIN cars c ON c.id = m.car_id
       WHERE m.id = $1 AND c.user_id = $2`,
      [req.params.id, req.userId]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    await pool.query('DELETE FROM maintenance WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

// ============================================================
// СЛУЖЕБНОЕ
// ============================================================

// Проверка связи
app.get('/api/ping', async (req, res) => {
  try {
    const r = await pool.query('SELECT NOW() AS now');
    res.json({ ok: true, time: r.rows[0].now });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Garage API запущен на порту ${PORT}`);
});