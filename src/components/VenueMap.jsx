import { useEffect, useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const wrapperStyle = {
  width: '100%',
  height: '500px',
  transform: 'translateZ(0)', // Fix for rendering glitches
};

const center = {
  lat: -25.9655,
  lng: 32.5832,
};

const VenueMap = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [venues, setVenues] = useState([]);
  const [selected, setSelected] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/venues`)
      .then((res) => res.json())
      .then((data) => setVenues(data))
      .catch((err) => console.error('❌ Failed to load venues', err));
  }, []);

  if (loadError) return <p>❌ Error loading maps</p>;
  if (!isLoaded) return <p>🔄 Loading Maps...</p>;

  return (
    <div style={wrapperStyle}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={center}
      >
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            position={{ lat: parseFloat(venue.lat), lng: parseFloat(venue.lng) }}
            onClick={() => setSelected(venue)}
          />
        ))}

        {selected && (
          <InfoWindow
            position={{ lat: parseFloat(selected.lat), lng: parseFloat(selected.lng) }}
            onCloseClick={() => setSelected(null)}
          >
            <div>
              <h3 className="font-bold">{selected.name}</h3>
              <p>{selected.address}</p>
              <p>{selected.category}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default VenueMap;