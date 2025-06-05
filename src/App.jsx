import React, { useState } from 'react';
import VenueInput from './components/VenueInput';
import VenueList from './components/VenueList';

const App = () => {
  const [editingVenue, setEditingVenue] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleCreateOrUpdate = () => {
    setEditingVenue(null);
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="p-4">
      <VenueInput
        editingVenue={editingVenue}
        onCreateOrUpdate={handleCreateOrUpdate}
      />
      <VenueList
        refreshTrigger={refreshCounter}
        onEdit={setEditingVenue}
      />
    </div>
  );
};

export default App;