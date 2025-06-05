import React, { useEffect, useState } from 'react';
import axios from 'axios';

const VenueList = ({ refreshTrigger, onEdit }) => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/venues`);
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setVenues(data);
      } catch (err) {
        console.error('Error loading venues:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [refreshTrigger]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this venue?')) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/venues/${id}`);
      setVenues(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete venue.');
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading venues...</div>;
  }

  return (
    <div className="mt-8 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Saved Venues</h2>

      {venues.length === 0 ? (
        <div className="text-gray-500">No venues saved yet.</div>
      ) : (
        <div className="space-y-4">
          {venues.map(venue => (
            <div
              key={venue.id}
              className="p-4 border rounded shadow-sm bg-white flex justify-between items-center"
            >
              <div>
                <div className="font-semibold text-lg">{venue.name}</div>
                <div className="text-sm text-gray-600">
                  {venue.city_name}, {venue.province_name} &middot; {venue.category}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(venue)}
                  className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(venue.id)}
                  className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VenueList;