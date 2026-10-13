import { useState, useEffect } from 'react';

function CarForm({ onSubmit, editing, onCancel }) {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');

  useEffect(() => {
    if (editing) {
      setName(editing.name || '');
      setYear(editing.year || '');
      setMileage(editing.mileage || '');
    } else {
      setName('');
      setYear('');
      setMileage('');
    }
  }, [editing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      year: year ? Number(year) : null,
      mileage: mileage ? Number(mileage) : 0,
    });
    if (!editing) {
      setName('');
      setYear('');
      setMileage('');
    }
  };

  return (
    <form className="car-form" onSubmit={handleSubmit}>
      <h3>{editing ? '✏️ Редактировать машину' : '➕ Добавить машину'}</h3>

      <input
        type="text"
        placeholder="Название"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Год"
        value={year}
        onChange={(e) => setYear(e.target.value)}
      />
      <input
        type="number"
        placeholder="Пробег, км"
        value={mileage}
        onChange={(e) => setMileage(e.target.value)}
      />

      <div className="form-buttons">
        <button type="submit">{editing ? 'Сохранить' : 'Добавить'}</button>
        {editing && (
          <button type="button" className="cancel" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

export default CarForm;