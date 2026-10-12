import { useState, useEffect } from 'react';
import axios from 'axios';
import CarForm from './components/CarForm';
import CarList from './components/CarList';
import CarDetails from './components/CarDetails';
import { API_URL as API } from './config';

function App() {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [editingCar, setEditingCar] = useState(null);

  const loadCars = async () => {
    const res = await axios.get(`${API}/cars`);
    setCars(res.data);
    if (!selectedCar && res.data.length > 0) {
      setSelectedCar(res.data[0]);
    }
  };

  useEffect(() => {
    loadCars();
  }, []);

  const handleAddCar = async (car) => {
    await axios.post(`${API}/cars`, car);
    loadCars();
  };

  const handleUpdateCar = async (id, car) => {
    await axios.put(`${API}/cars/${id}`, car);
    setEditingCar(null);
    loadCars();
  };

  const handleDeleteCar = async (id) => {
    if (!confirm('Удалить машину и все её записи?')) return;
    await axios.delete(`${API}/cars/${id}`);
    if (selectedCar?.id === id) setSelectedCar(null);
    loadCars();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚗 Мой гараж</h1>
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
              onBack={() => setSelectedCar(null)}
              onUpdate={loadCars}
            />
          ) : (
            <p className="empty">Выбери машину или добавь новую</p>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;