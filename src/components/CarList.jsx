function CarList({ cars, selectedCar, onSelect, onEdit, onDelete }) {
  if (cars.length === 0) {
    return <p className="empty">Машин пока нет</p>;
  }

  return (
    <ul className="car-list">
      {cars.map((car) => (
        <li
          key={car.id}
          className={selectedCar?.id === car.id ? 'active' : ''}
          onClick={() => onSelect(car)}
        >
          <div className="car-info">
            <strong>{car.name}</strong>
            <span>
              {car.year} • {car.mileage?.toLocaleString('ru-RU')} км
            </span>
          </div>
          <div className="car-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(car);
              }}
              title="Редактировать"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(car.id);
              }}
              title="Удалить"
            >
              🗑️
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default CarList;