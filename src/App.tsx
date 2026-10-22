import { useState, useEffect } from 'react';

interface Booking {
  id: string;
  title: string;
  organizer: string;
  date: string;
  startTime: string;
  endTime: string;
  participants: number;
  description: string;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 - 20:00

function App() {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('meeting-room-bookings');
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    organizer: '',
    date: selectedDate,
    startTime: '09:00',
    endTime: '10:00',
    participants: 1,
    description: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('meeting-room-bookings', JSON.stringify(bookings));
  }, [bookings]);

  const checkConflict = (date: string, startTime: string, endTime: string, excludeId?: string): boolean => {
    return bookings.some((b) => {
      if (excludeId && b.id === excludeId) return false;
      if (b.date !== date) return false;
      return startTime < b.endTime && endTime > b.startTime;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Укажите название встречи');
      return;
    }
    if (!formData.organizer.trim()) {
      setError('Укажите организатора');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      setError('Время начала должно быть раньше времени окончания');
      return;
    }
    if (checkConflict(formData.date, formData.startTime, formData.endTime, editingBooking?.id)) {
      setError('На это время уже есть бронирование!');
      return;
    }

    if (editingBooking) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === editingBooking.id
            ? { ...b, ...formData }
            : b
        )
      );
      setEditingBooking(null);
    } else {
      const newBooking: Booking = {
        id: Date.now().toString(),
        ...formData,
      };
      setBookings((prev) => [...prev, newBooking]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      organizer: '',
      date: selectedDate,
      startTime: '09:00',
      endTime: '10:00',
      participants: 1,
      description: '',
    });
    setShowForm(false);
    setError('');
    setEditingBooking(null);
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setFormData({
      title: booking.title,
      organizer: booking.organizer,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      participants: booking.participants,
      description: booking.description,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить это бронирование?')) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const dayBookings = bookings
    .filter((b) => b.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getBookingPosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return ((hours - 8) * 60 + minutes) / (12 * 60) * 100;
  };

  const getBookingWidth = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = (sh - 8) * 60 + sm;
    const endMin = (eh - 8) * 60 + em;
    return ((endMin - startMin) / (12 * 60)) * 100;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDuration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours === 0) return `${mins} мин`;
    if (mins === 0) return `${hours} ч`;
    return `${hours} ч ${mins} мин`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Переговорная комната</h1>
              <p className="text-sm text-blue-300">Планирование бронирований</p>
            </div>
          </div>
          <button
            onClick={() => {
              setFormData((prev) => ({ ...prev, date: selectedDate }));
              setShowForm(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Забронировать
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Date selector */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              const d = new Date(selectedDate + 'T00:00:00');
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white [color-scheme:dark]"
          />
          <button
            onClick={() => {
              const d = new Date(selectedDate + 'T00:00:00');
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="text-lg font-medium capitalize">{formatDate(selectedDate)}</span>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="ml-auto text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Сегодня
          </button>
        </div>

        {/* Timeline */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Расписание на день
          </h2>
          
          {/* Timeline bar */}
          <div className="relative mb-4">
            <div className="h-16 bg-white/5 rounded-lg border border-white/10 relative overflow-hidden">
              {/* Hour markers */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute top-0 bottom-0 border-l border-white/10"
                  style={{ left: `${((hour - 8) / 12) * 100}%` }}
                >
                  <span className="absolute -top-5 left-1 text-xs text-gray-400">
                    {hour}:00
                  </span>
                </div>
              ))}
              
              {/* Bookings on timeline */}
              {dayBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="absolute top-1 bottom-1 rounded bg-blue-500/80 hover:bg-blue-400/80 cursor-pointer transition-colors flex items-center px-2 overflow-hidden"
                  style={{
                    left: `${getBookingPosition(booking.startTime)}%`,
                    width: `${getBookingWidth(booking.startTime, booking.endTime)}%`,
                  }}
                  onClick={() => handleEdit(booking)}
                  title={`${booking.title} (${booking.startTime} - ${booking.endTime})`}
                >
                  <span className="text-xs font-medium truncate">{booking.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {dayBookings.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>Нет бронирований на этот день</p>
              <p className="text-sm mt-1">Нажмите "Забронировать" чтобы создать</p>
            </div>
          )}
        </div>

        {/* Bookings list */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Бронирования ({dayBookings.length})
          </h2>
          
          {dayBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{booking.title}</h3>
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                      {booking.participants} {booking.participants === 1 ? 'участник' : booking.participants < 5 ? 'участника' : 'участников'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {booking.startTime} — {booking.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {booking.organizer}
                    </span>
                    <span className="text-gray-400">
                      ({getDuration(booking.startTime, booking.endTime)})
                    </span>
                  </div>
                  {booking.description && (
                    <p className="text-sm text-gray-400 mt-2">{booking.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(booking)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    title="Редактировать"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(booking.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
                    title="Удалить"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
            <div className="text-sm text-gray-400">Всего бронирований</div>
            <div className="text-2xl font-bold mt-1">{dayBookings.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
            <div className="text-sm text-gray-400">Общее время</div>
            <div className="text-2xl font-bold mt-1">
              {dayBookings.reduce((acc, b) => {
                const [sh, sm] = b.startTime.split(':').map(Number);
                const [eh, em] = b.endTime.split(':').map(Number);
                return acc + (eh * 60 + em) - (sh * 60 + sm);
              }, 0) / 60} ч
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
            <div className="text-sm text-gray-400">Свободно</div>
            <div className="text-2xl font-bold mt-1">
              {(12 - dayBookings.reduce((acc, b) => {
                const [sh, sm] = b.startTime.split(':').map(Number);
                const [eh, em] = b.endTime.split(':').map(Number);
                return acc + (eh * 60 + em) - (sh * 60 + sm);
              }, 0) / 60).toFixed(1)} ч
            </div>
          </div>
        </div>
      </main>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingBooking ? 'Редактировать бронирование' : 'Новое бронирование'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Название встречи *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Например: Планирование спринта"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Организатор *
                </label>
                <input
                  type="text"
                  value={formData.organizer}
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  placeholder="Имя организатора"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Начало
                  </label>
                  <select
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {Array.from({ length: 25 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 8;
                      const min = (i % 2) * 30;
                      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                      return <option key={time} value={time}>{time}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Окончание
                  </label>
                  <select
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {Array.from({ length: 25 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 8;
                      const min = (i % 2) * 30;
                      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                      return <option key={time} value={time}>{time}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Количество участников
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) || 1 })}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Повестка, ссылки, заметки..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  {editingBooking ? 'Сохранить' : 'Забронировать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
