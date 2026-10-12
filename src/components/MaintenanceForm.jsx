import { useState, useEffect } from 'react';

function MaintenanceForm({ onSave, onCancel, editing }) {
  const [date, setDate] = useState('');
  const [mileage, setMileage] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');

  useEffect(() => {
    if (editing) {
      setDate(editing.date ? editing.date.slice(0, 10) : '');
      setMileage(editing.mileage || '');
      setDescription(editing.description || '');
      setCost(editing.cost || '');
    } else {
      setDate(new Date().toISOString().slice(0, 10));
      setMileage('');
      setDescription('');
      setCost('');
    }
  }, [editing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || !date) return;
    onSave({
      date,
      mileage: mileage ? Number(mileage) : null,
      description: description.trim(),
      cost: cost ? Number(cost) : 0,
    });
    if (!editing) {
      setDate(new Date().toISOString().slice(0, 10));
      setMileage('');
      setDescription('');
      setCost('');
    }
  };

  return (
    <form className="maintenance-form" onSubmit={handleSubmit}>
      <h3>{editing ? '✏️ Редактировать запись ТО' : '➕ Добавить запись ТО'}</h3>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Пробег, км"
        value={mileage}
        onChange={(e) => setMileage(e.target.value)}
      />
      <input
        type="text"
        placeholder="Что делал (замена масла, фильтров)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <input
        type="number"
        step="0.01"
        placeholder="Стоимость, ₽"
        value={cost}
        onChange={(e) => setCost(e.target.value)}
      />

      <div className="form-buttons">
        <button type="submit">{editing ? 'Сохранить' : 'Добавить'}</button>
        {onCancel && (
          <button type="button" className="cancel" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

export default MaintenanceForm;