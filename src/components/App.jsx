import { useState } from 'react';
import VenueMap from './components/VenueMap';
import VenueInput from './components/VenueInput';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <div>
      <div style={{ padding: '10px', textAlign: 'right' }}>
        <button onClick={() => setIsAdmin(!isAdmin)}>
          🔄 Switch to {isAdmin ? 'Public View' : 'Admin View'}
        </button>
      </div>

      {isAdmin ? <VenueInput /> : <VenueMap />}
    </div>
  );
}

export default App;