import './App.css';
import { useState } from 'react';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
    
    if(event.target.value.trim() !== ''){
      setResults(['Song 1', 'Song 2', 'Song 3', 'Song 4', 'Song 5']
        .filter(song => song.toLowerCase().includes(event.target.value.toLowerCase()
      )));
    } else {
      setResults([]);
    }
  }

  return (
    <div className="background">
      <div style={{marginTop: '17.5%', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease', transform: searchTerm ? 'translateY(-15rem)' : 'translateY(0)'}}>
        <label style={{fontSize: '2rem', marginBottom: '0.5rem', opacity: searchTerm ? '0%' : '100%'}}>Search for a Song</label>
        <input type='text' autoFocus value={searchTerm} onChange={handleInputChange} style={{backgroundColor: '#434343', border: 'none', borderRadius: '20px', fontSize: '3rem', color: 'white', padding: '10px', width: '50rem'}}/>
        {results.length > 0 && (
          <div style={{backgroundColor: '#434343', width: '50rem', zIndex: '-1', marginLeft: '.5rem', marginTop: '-.5rem', borderRadius: '10px'}}>
            <ul style={{padding: '0', paddingRight: '2.5px'}}>
              {results.map((result, index) => (
                <div style={{border: '1px solid #b3b3b3', borderRadius: '10px', marginTop: '1rem', marginLeft: '1rem', marginRight: '1rem', backgroundColor: '#212121', display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly'}}>
                  <div>
                    <p style={{fontWeight: 'bold'}}>{result}</p>
                    <p>Artist Here</p>
                  </div>
                  <div style={{width: '5rem', height: '5rem', backgroundColor: 'black'}}/>
                </div>
              ))}
            </ul>
          </div>
        )}
      </div>
      <p style={{position: 'fixed', bottom: '0'}}>Powered by Spotify Developer APIs</p>
    </div>
  );
}

export default App;
