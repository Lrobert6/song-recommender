import './App.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

const SongSwiper = () => {
  const location = useLocation();
  const song = location.state?.song || {};
  return (
    <div>
      <h1>{song.name}</h1>
    </div>
  )
};

const Home = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [songs, setSongs] = useState([]);
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, 300)
    return () => {
      clearTimeout(timer);
    }
  }, [searchTerm])

  useEffect(() => {
    const handleSearch = async () => {
      if(!debouncedTerm.trim()) {
        setSongs([]);
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) {
          throw new Error("Failed to fetch songs");
        }
  
        const data = await response.json();
        setSongs(data);
      } catch (error) {
        console.error("Error searching for songs:", error);
      }
      
    }
    handleSearch();
  }, [debouncedTerm])

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if(!e.target.value.trim()){
      setSongs([]);
    }
  }

  const handleCardClick = (song) => {
    navigate('/song-swiper', {state: {song}})
  }

  return (
    <div className="background">
      <div style={{marginTop: '17.5%', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease', transform: searchTerm ? 'translateY(-17.5rem)' : 'translateY(0)'}}>
        <label style={{fontSize: '2rem', marginBottom: '0.5rem', opacity: searchTerm ? '0%' : '100%'}}>Search for a Song</label>
        <input type='text' autoFocus value={searchTerm}  onChange={handleInputChange} style={{backgroundColor: '#434343', border: 'none', borderRadius: '20px', fontSize: '3rem', color: 'white', padding: '10px', width: '50rem'}}/>
        {songs.length > 0 && (
          <div style={{backgroundColor: '#434343', width: '50rem', zIndex: '-1', marginLeft: '.5rem', marginTop: '-.5rem', borderRadius: '10px'}}>
            <ul style={{padding: '0'}}>
                {songs.map((song) => (
              <div className='card' onClick={() => handleCardClick(song)} key={song.id} style={{marginBottom: "10px", display: 'flex', flexDirection: 'row', alignContent: 'center', justifyContent: 'space-between', width: '92.5%', marginLeft: '1.8%'}}>
                <p style={{marginLeft: '3rem'}}><strong style={{fontSize: '1.5rem'}}>{song.name}</strong>
                <br/>{song.artists.map((artist) => artist.name).join(', ')}</p>
                <img src={song.album.images[0]?.url} alt='Album Cover' width= '100rem' height='100rem' style={{marginRight: '3rem'}}/>
              </div>
            ))}
            </ul>
          </div>
        )}
      </div>
      <p style={{position: 'fixed', bottom: '0'}}>Created by <a href='http://www.lucasrobert.com' rel='noreferrer' target='_blank'>Lucas Robert</a><br/>Powered by Spotify Developer APIs</p>
    </div>
  );
}

function App(){
  return(
    <Router>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/song-swiper' element={<SongSwiper/>}/>
      </Routes>
    </Router>
  )
}

export default App;
