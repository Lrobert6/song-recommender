import './App.css';
import { useState } from 'react';

function App() {
  const [searchTerm, setSearchTerm] = useState('');


  return (
    <div className="background">
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <label style={{fontSize: '2rem', marginBottom: '0.5rem'}}>Search for a Song</label>
        <input type='text' autoFocus style={{backgroundColor: '#434343', border: 'none', borderRadius: '20px', fontSize: '3rem', color: 'white', padding: '10px'}}/>
      </div>
    </div>
  );
}

export default App;
