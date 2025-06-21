import React, { useEffect, useRef, useState } from 'react';
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
  StandaloneSearchBox,
} from '@react-google-maps/api';
import axios from 'axios';
import toast from 'react-hot-toast';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const center = {
  lat: -25.9655,
  lng: 32.5832,
};

const libraries = ['places'];

const VenueInput = ({ editingVenue, onCreateOrUpdate }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [mapRef, setMapRef] = useState(null);
  const [marker, setMarker] = useState(null);
  const [venueName, setVenueName] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [provinceId, setProvinceId] = useState('');
  const [cityId, setCityId] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState(null);
  const [searchBox, setSearchBox] = useState(null);

  const searchBoxRef = useRef(null);

  const categories = ['Club', 'Bar', 'Restaurant', 'Outdoor'];

  useEffect(() => {
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (provinceId) fetchCities(provinceId);
  }, [provinceId]);

  const fetchProvinces = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/provinces`);
      setProvinces(res.data);
    } catch (err) {
      toast.error('Failed to load provinces');
    }
  };

  const fetchCities = async (provId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/cities?provinceId=${provId}`);
      setCities(res.data);
    } catch (err) {
      toast.error('Failed to load cities');
    }
  };

  const normalize = (str) =>
    str?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const handleMapClick = async (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMarker({ lat, lng });

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        const name = results[0].address_components[0]?.long_name || 'Unnamed Location';
        setFullAddress(address);
        setVenueName(name);
        autoSelectProvinceCity(results[0]);
      }
    });
  };

  const autoSelectProvinceCity = (place) => {
    const addr = place.address_components;

    const provinceMatch = addr.find((c) =>
      ['administrative_area_level_1', 'administrative_area_level_2'].includes(c.types[0])
    );
    const cityMatch = addr.find((c) => c.types.includes('locality') || c.types.includes('sublocality'));

    if (provinceMatch) {
      const foundProv = provinces.find(
        (p) => normalize(p.name) === normalize(provinceMatch.long_name)
      );
      if (foundProv) {
        setProvinceId(foundProv.id);
        fetchCities(foundProv.id);
      }
    }

    if (cityMatch) {
      setTimeout(() => {
        const foundCity = cities.find((c) => normalize(c.name) === normalize(cityMatch.long_name));
        if (foundCity) setCityId(foundCity.id);
      }, 500);
    }
  };

  const onPlacesChanged = () => {
    const places = searchBox.getPlaces();
    if (places && places.length > 0) {
      const place = places[0];
      const location = place.geometry.location;
      const lat = location.lat();
      const lng = location.lng();

      setMarker({ lat, lng });
      setVenueName(place.name);
      setFullAddress(place.formatted_address);
      autoSelectProvinceCity(place);
      if (mapRef) mapRef.panTo({ lat, lng });
    }
  };

  const handleSave = async () => {
    if (!venueName || !fullAddress || !provinceId || !cityId || !category || !marker) {
      toast.error('Please fill in all fields and drop a marker');
      return;
    }

    const venue = {
      name: venueName,
      address: fullAddress,
      province_id: provinceId,
      city_id: cityId,
      category,
      lat: marker.lat,
      lng: marker.lng,
    };

    try {
      if (editingVenue) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/venues/${editingVenue.id}`, venue);
        toast.success('Venue updated!');
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/venues`, venue);
        toast.success('Venue saved!');
      }

      setVenueName('');
      setFullAddress('');
      setProvinceId('');
      setCityId('');
      setCategory('');
      setMarker(null);
      onCreateOrUpdate();
    } catch (err) {
      toast.error('Failed to save venue');
    }
  };

  if (loadError) return <p>Error loading map</p>;
  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <div className="p-4 space-y-4">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={marker || center}
        onClick={handleMapClick}
        onLoad={(map) => setMapRef(map)}
      >
        {marker && <Marker position={marker} />}
      </GoogleMap>

      <StandaloneSearchBox
        onLoad={(ref) => setSearchBox(ref)}
        onPlacesChanged={onPlacesChanged}
      >
        <input
          type="text"
          placeholder="Search place"
          ref={searchBoxRef}
          className="border px-2 py-1 w-full"
        />
      </StandaloneSearchBox>

      <input
        type="text"
        placeholder="Venue name"
        className="border px-2 py-1 w-full"
        value={venueName}
        onChange={(e) => setVenueName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Full address"
        className="border px-2 py-1 w-full"
        value={fullAddress}
        onChange={(e) => setFullAddress(e.target.value)}
      />
      <select
        className="border px-2 py-1 w-full"
        value={provinceId}
        onChange={(e) => setProvinceId(e.target.value)}
      >
        <option value="">Select Province</option>
        {provinces.map((prov) => (
          <option key={prov.id} value={prov.id}>
            {prov.name}
          </option>
        ))}
      </select>
      <select
        className="border px-2 py-1 w-full"
        value={cityId}
        onChange={(e) => setCityId(e.target.value)}
      >
        <option value="">Select City</option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
      <select
        className="border px-2 py-1 w-full"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">Select Category</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {editingVenue ? 'Update Venue' : 'Save Venue'}
      </button>
    </div>
  );
};

export default VenueInput;
