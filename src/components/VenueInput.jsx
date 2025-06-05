import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, useLoadScript, Autocomplete } from '@react-google-maps/api';
import axios from 'axios';
import toast from 'react-hot-toast';

const libraries = ['places'];
const mapContainerStyle = { width: '100%', height: '400px' };
const mapCenter = { lat: -25.9655, lng: 32.5832 };

const VenueInput = ({ editingVenue, onCreateOrUpdate }) => {
  const [mapRef, setMapRef] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [marker, setMarker] = useState(null);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories] = useState(['Club', 'Bar', 'Restaurant', 'Outdoor']);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingId, setEditingId] = useState(null);

  const searchInput = useRef(null);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/provinces`)
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : data.data;
        if (Array.isArray(arr)) setProvinces(arr);
        else throw new Error('Invalid province data format');
      })
      .catch(() => toast.error('Error loading provinces'));

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cities`)
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : data.data;
        if (Array.isArray(arr)) setCities(arr);
        else throw new Error('Invalid city data format');
      })
      .catch(() => toast.error('Error loading cities'));
  }, []);

  useEffect(() => {
    if (editingVenue) {
      const { id, latitude, longitude, name, address, province_id, city_id, category } = editingVenue;
      setMarker({ lat: latitude, lng: longitude });
      setVenueName(name);
      setVenueAddress(address || '');
      setSelectedProvince(province_id);
      setSelectedCity(city_id);
      setSelectedCategory(category);
      setEditingId(id);
    } else {
      resetForm();
    }
  }, [editingVenue]);

  const resetForm = () => {
    setMarker(null);
    setVenueName('');
    setVenueAddress('');
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedCategory('');
    setEditingId(null);
  };

  const normalize = str => str?.toLowerCase().replace(/[\s\.,]/g, '') || '';

  const extractAddress = (components) => {
    const get = (type) => {
      const match = components.find(c => c.types.includes(type));
      return match ? match.long_name : '';
    };
    return {
      province: get('administrative_area_level_1'),
      city: get('administrative_area_level_2') || get('locality'),
    };
  };

  const reverseGeocode = async (lat, lng) => {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK') resolve(results);
        else reject(status);
      });
    });
  };

  const handleMapClick = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarker({ lat, lng });

    try {
      const results = await reverseGeocode(lat, lng);
      const address = extractAddress(results[0].address_components);
      const formattedAddress = results[0].formatted_address || '';
      const placeName = results[0].name || formattedAddress?.split(',')[0];

      setVenueName(placeName || '');
      setVenueAddress(formattedAddress);

      const matchedProvince = provinces.find(p =>
        normalize(address.province).includes(normalize(p.name))
      );
      const matchedCity = cities.find(c =>
        normalize(address.city).includes(normalize(c.name)) &&
        (!matchedProvince || c.province_id === matchedProvince.id)
      );

      if (matchedProvince) setSelectedProvince(matchedProvince.id);
      if (matchedCity) setSelectedCity(matchedCity.id);
    } catch (err) {
      console.error('Reverse geocoding failed', err);
    }
  };

  const handlePlaceChange = async () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    setMarker({ lat, lng });
    mapRef.panTo({ lat, lng });

    try {
      const results = await reverseGeocode(lat, lng);
      const address = extractAddress(results[0].address_components);
      const formattedAddress = results[0].formatted_address || '';
      const placeName = place.name || formattedAddress?.split(',')[0];

      setVenueName(placeName || '');
      setVenueAddress(formattedAddress);

      const matchedProvince = provinces.find(p =>
        normalize(address.province).includes(normalize(p.name))
      );
      const matchedCity = cities.find(c =>
        normalize(address.city).includes(normalize(c.name)) &&
        (!matchedProvince || c.province_id === matchedProvince.id)
      );

      if (matchedProvince) setSelectedProvince(matchedProvince.id);
      if (matchedCity) setSelectedCity(matchedCity.id);
    } catch (err) {
      console.error('Place selection geocoding failed', err);
    }
  };

  const handleSave = async () => {
    if (!venueName || !marker || !venueAddress || !selectedProvince || !selectedCity || !selectedCategory) {
      toast.error('Please fill all fields');
      return;
    }

    const payload = {
      name: venueName,
      latitude: marker.lat,
      longitude: marker.lng,
      address: venueAddress, // ✅ This must be named exactly 'address'
      province_id: selectedProvince,
      city_id: selectedCity,
      category: selectedCategory,
    };

    console.log("Payload being sent to backend:", payload); // ✅ Debug log

    try {
      const url = editingId
        ? `${import.meta.env.VITE_API_BASE_URL}/api/venues/${editingId}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/venues`;

      const method = editingId ? 'put' : 'post';
      await axios[method](url, payload);

      toast.success(editingId ? 'Venue updated' : 'Venue saved');
      resetForm();
      onCreateOrUpdate();
    } catch (err) {
      console.error('Error saving venue:', err.response?.data || err.message); // ✅ More informative logging
      toast.error('Failed to save venue');
    }
  };

  const filteredCities = cities.filter(c => c.province_id === selectedProvince);

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={marker || mapCenter}
        zoom={marker ? 15 : 12}
        onClick={handleMapClick}
        onLoad={(map) => setMapRef(map)}
      >
        {marker && <Marker position={marker} />}
      </GoogleMap>

      <Autocomplete onLoad={setAutocomplete} onPlaceChanged={handlePlaceChange}>
        <input
          type="text"
          placeholder="Search place"
          ref={searchInput}
          className="w-full p-2 border rounded"
        />
      </Autocomplete>

      <input
        type="text"
        value={venueName}
        onChange={e => setVenueName(e.target.value)}
        placeholder="Venue name"
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        value={venueAddress}
        onChange={e => setVenueAddress(e.target.value)}
        placeholder="Full address"
        className="w-full p-2 border rounded"
      />

      <select
        value={selectedProvince}
        onChange={e => {
          setSelectedProvince(Number(e.target.value));
          setSelectedCity('');
        }}
        className="w-full p-2 border rounded"
      >
        <option value="">Select Province</option>
        {Array.isArray(provinces) && provinces.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <select
        value={selectedCity}
        onChange={e => setSelectedCity(Number(e.target.value))}
        className="w-full p-2 border rounded"
      >
        <option value="">Select City</option>
        {Array.isArray(filteredCities) && filteredCities.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select
        value={selectedCategory}
        onChange={e => setSelectedCategory(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">Select Category</option>
        {categories.map((cat, i) => (
          <option key={i} value={cat}>{cat}</option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editingId ? 'Update Venue' : 'Save Venue'}
        </button>
        <button
          onClick={resetForm}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default VenueInput;
