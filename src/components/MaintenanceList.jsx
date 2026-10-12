function MaintenanceList({ maintenance, onEdit, onDelete }) {
  if (maintenance.length === 0) {
    return <p className="empty">Записей пока нет</p>;
  }

  return (
    <div className="maintenance-list">
      <h3>📋 История обслуживания</h3>
      <ul>
        {maintenance.map((m) => (
          <li key={m.id}>
            <div className="m-info">
              <strong>{m.description}</strong>
              <span>
                {new Date(m.date).toLocaleDateString('ru-RU')}
                {m.mileage ? ` • ${m.mileage.toLocaleString('ru-RU')} км` : ''}
                {m.cost ? ` • ${Number(m.cost).toLocaleString('ru-RU')} ₽` : ''}
              </span>
            </div>
            <div className="m-actions">
              <button onClick={() => onEdit(m)} title="Редактировать">
                ✏️
              </button>
              <button onClick={() => onDelete(m.id)} title="Удалить">
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MaintenanceList;