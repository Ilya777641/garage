import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import MaintenanceForm from './MaintenanceForm';
import { API_URL } from '../config';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MAINTENANCE_INTERVAL = 7000;

function CarDetails({ car, onBack, onUpdate }) {
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    fetchMaintenance(true);

    const interval = setInterval(() => {
      fetchMaintenance(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [car.id]);

  const fetchMaintenance = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/maintenance/${car.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMaintenance(data);
      } else {
        setMaintenance([]);
      }
    } catch (err) {
      console.error('Ошибка загрузки ТО:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSaveMaintenance = async (record) => {
    try {
      const isEdit = !!editingRecord;
      const url = isEdit
        ? `${API_URL}/maintenance/${editingRecord.id}`
        : `${API_URL}/maintenance`;
      const method = isEdit ? 'PUT' : 'POST';

      const body = isEdit
        ? {
            date: record.date,
            mileage: record.mileage,
            description: record.description,
            cost: record.cost,
          }
        : {
            car_id: car.id,
            date: record.date,
            mileage: record.mileage,
            description: record.description,
            cost: record.cost,
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchMaintenance();
        if (onUpdate) onUpdate();
        setShowForm(false);
        setEditingRecord(null);
      } else {
        alert('Ошибка сохранения');
      }
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Ошибка сохранения');
    }
  };

  const handleDeleteMaintenance = async (id) => {
    if (!confirm('Удалить запись?')) return;
    try {
      await fetch(`${API_URL}/maintenance/${id}`, { method: 'DELETE' });
      setMaintenance(maintenance.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Ошибка удаления:', err);
    }
  };

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const totalCost = maintenance.reduce(
    (sum, m) => sum + (parseFloat(m.cost) || 0),
    0
  );
  const lastMaintenance = maintenance[0];

  const calculateReminder = () => {
    const currentMileage = car.mileage || 0;
    if (currentMileage === 0) return null;

    const nextServiceMileage =
      Math.ceil((currentMileage + 1) / MAINTENANCE_INTERVAL) * MAINTENANCE_INTERVAL;
    const kmLeft = nextServiceMileage - currentMileage;

    if (kmLeft <= 0) {
      return {
        type: 'overdue',
        title: '⚠️ ПОРА НА ТО!',
        message: `Пробег превысил ${nextServiceMileage.toLocaleString()} км. Замена масла просрочена!`,
      };
    } else if (kmLeft <= 1000) {
      return {
        type: 'soon',
        title: '🔔 Скоро ТО',
        message: `До замены масла осталось ${kmLeft.toLocaleString()} км (на ${nextServiceMileage.toLocaleString()} км).`,
      };
    } else {
      return {
        type: 'ok',
        title: '✅ Всё в порядке',
        message: `Следующее ТО на ${nextServiceMileage.toLocaleString()} км (осталось ${kmLeft.toLocaleString()} км).`,
      };
    }
  };

  const reminder = calculateReminder();

  const getMonthlyData = () => {
    const months = {};
    const monthNames = [
      'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
      'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
    ];

    const now = new Date();
    const labels = [];
    const keys = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      labels.push(`${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`);
      keys.push(key);
      months[key] = 0;
    }

    maintenance.forEach((record) => {
      const date = new Date(record.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (months[key] !== undefined) {
        months[key] += parseFloat(record.cost) || 0;
      }
    });

    return {
      labels,
      data: keys.map((k) => months[k]),
    };
  };

  const monthlyData = getMonthlyData();

  const chartData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Расходы, ₽',
        data: monthlyData.data,
        backgroundColor: 'rgba(212, 175, 55, 0.6)',
        borderColor: '#d4af37',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: '#f5d76e',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1c22',
        borderColor: '#d4af37',
        borderWidth: 1,
        titleColor: '#f5d76e',
        bodyColor: '#f1ede4',
        titleFont: { family: 'Inter', size: 14 },
        bodyFont: { family: 'Inter', size: 14 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) =>
            `Расходы: ${context.parsed.y.toLocaleString()} ₽`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#a8abb2',
          font: { family: 'Inter', size: 12 },
          callback: (value) => value.toLocaleString() + ' ₽',
        },
        grid: { color: 'rgba(212, 175, 55, 0.08)' },
      },
      x: {
        ticks: {
          color: '#a8abb2',
          font: { family: 'Inter', size: 11 },
        },
        grid: { display: false },
      },
    },
  };

  const hasChartData = monthlyData.data.some((v) => v > 0);

  return (
    <div className="car-details-container">
      <button className="btn-back" onClick={onBack}>
        ← Назад
      </button>

      <div className="car-details">
        <div className="car-details-header">
          <div className="car-details-icon">🚗</div>
          <div>
            <h1>{car.name}</h1>
            <div className="car-details-meta">
              {car.year && <span>📅 {car.year} г.</span>}
              {car.mileage > 0 && (
                <span>🛣 {car.mileage.toLocaleString()} км</span>
              )}
            </div>
          </div>
        </div>

        {reminder && (
          <div className={`reminder-box reminder-${reminder.type}`}>
            <div className="reminder-title">{reminder.title}</div>
            <div className="reminder-message">{reminder.message}</div>
          </div>
        )}

        <div className="car-stats">
          <div className="stat-card">
            <div className="stat-value">{maintenance.length}</div>
            <div className="stat-label">Записей ТО</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalCost.toLocaleString()} ₽</div>
            <div className="stat-label">Всего потрачено</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {lastMaintenance
                ? new Date(lastMaintenance.date).toLocaleDateString('ru-RU')
                : '—'}
            </div>
            <div className="stat-label">Последнее ТО</div>
          </div>
        </div>

        {hasChartData && (
          <div className="chart-section">
            <h2 className="chart-title">📊 Расходы по месяцам</h2>
            <div className="chart-wrapper">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        <div className="section-header-with-counter">
          <h2>История обслуживания</h2>
          <button
            className="btn-add-small"
            onClick={() => {
              setEditingRecord(null);
              setShowForm(true);
            }}
          >
            + Добавить запись
          </button>
        </div>

        {showForm && (
          <MaintenanceForm
            onSave={handleSaveMaintenance}
            onCancel={handleCancelForm}
            editing={editingRecord}
          />
        )}

        {loading ? (
          <div className="empty-state">Загрузка...</div>
        ) : maintenance.length === 0 ? (
          <div className="empty-state">Пока нет записей. Добавь первую!</div>
        ) : (
          <div className="maintenance-list">
            {maintenance.map((record) => (
              <div key={record.id} className="maintenance-item">
                <div className="maintenance-date">
                  {new Date(record.date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                <div className="maintenance-body">
                  <div className="maintenance-description">
                    {record.description}
                  </div>
                  <div className="maintenance-details">
                    {record.mileage && (
                      <span>🛣 {record.mileage.toLocaleString()} км</span>
                    )}
                    {record.cost > 0 && (
                      <span className="maintenance-cost">
                        💰 {parseFloat(record.cost).toLocaleString()} ₽
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="maintenance-edit"
                  onClick={() => handleEditClick(record)}
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button
                  className="maintenance-delete"
                  onClick={() => handleDeleteMaintenance(record.id)}
                  title="Удалить"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CarDetails;