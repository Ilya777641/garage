require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ===== МАШИНЫ =====

// Получить все машины
app.get('/api/cars', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cars ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
});

// Добавить машину
app.post('/api/cars', async (req, res) => {
  try {
    const { name, year, mileage } = req.body;
    const result = await pool.query(
      'INSERT INTO cars (name, year, mileage) VALUES ($1, $2, $3) RETURNING *',
      [name, year, mileage || 0]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

// Обновить машину
app.put('/api/cars/:id', async (req, res) => {
  try {
    const { name, year, mileage } = req.body;
    const result = await pool.query(
      'UPDATE cars SET name = $1, year = $2, mileage = $3 WHERE id = $4 RETURNING *',
      [name, year, mileage, req.params.id]
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
app.delete('/api/cars/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cars WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

// ===== ТО =====

// Получить ТО для машины
app.get('/api/maintenance/:carId', async (req, res) => {
  try {
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
app.post('/api/maintenance', async (req, res) => {
  try {
    const { car_id, date, mileage, description, cost } = req.body;
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
app.put('/api/maintenance/:id', async (req, res) => {
  try {
    const { date, mileage, description, cost } = req.body;
    const result = await pool.query(
      'UPDATE maintenance SET date = $1, mileage = $2, description = $3, cost = $4 WHERE id = $5 RETURNING *',
      [date, mileage, description, cost || 0, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// Удалить ТО
app.delete('/api/maintenance/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM maintenance WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});