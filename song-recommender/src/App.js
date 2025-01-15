import './App.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { FaThumbsUp, FaThumbsDown, FaCircleQuestion} from 'react-icons/fa6';
import {ClipLoader} from 'react-spinners';

const SongSwiper = () => {
  const location = useLocation();
  const song = location.state?.song || {};
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trackInfo, setTrackInfo] = useState([]);
  const currentRecommendation = recommendations[currentIndex];
  
  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/recommendations?songId=${song.id}`);
      console.log(response);
      console.log(response.headers.get("content-type"));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }
      const data = await response.json();
      setRecommendations(data);
      setTimeout(() => {
        setLoading(false);
      }, 500)
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setLoading(false);
    }
  };
  
    const getTrackInfo = async () => {
      if (!currentRecommendation?.related_song_id) return;
  
      try {
        const response = await fetch(
          `/api/get-track?q=${encodeURIComponent(currentRecommendation.related_song_id)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch track information");
        }
  
        const data = await response.json();
        console.log("Track Information:", data); 
        setTrackInfo(data); 
      } catch (error) {
        console.error("Error fetching track information:", error);
      }
    };

  useEffect(() => {
    getTrackInfo();
  }, [currentRecommendation])

  console.log('Current recommendation: ',currentRecommendation);

  const handleAction = async (action) => {
    if (!currentRecommendation) return;
  
    try {
      const payload = {
        baseSongID: song.id,
        relatedSongID: currentRecommendation.related_song_id,
        action,
      };
  
      console.log("Payload sent to /api/log-action:", payload);
  
      const response = await fetch('http://localhost:5000/api/log-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) throw new Error("Failed to log action");
  
      console.log(`${action} action logged successfully`);
  
      // Move to the next recommendation
      if (currentIndex + 1 < recommendations.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        console.log("No more recommendations available!");
      }
    } catch (error) {
      console.error("Error logging action:", error);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [song.id]);

  useEffect(() => {
    getTrackInfo();
  }, [currentIndex]);

  if (loading) {
    return (
      <div className='background' style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', marginTop: '50%' }}>
        <ClipLoader color={'white'} size={50} />
        <p style={{ fontSize: '1.25rem' }}>Fetching recommendations...</p>
        <p style={{ position: 'fixed', bottom: '0' }}>Created by <a href='http://www.lucasrobert.com' rel='noreferrer' target='_blank'>Lucas Robert</a><br />Powered by Spotify Developer APIs</p>
      </div>
    );
  }

  if (!currentRecommendation) {
    return <p style={{ color: 'white', textAlign: 'center' }}>No recommendations available!</p>;
  }

  return (
    <div className='background'>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className='swiper-card' style={{ marginTop: '-3rem' }}>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white' }}>{trackInfo.name}</p>
          <p style={{ fontSize: '1.25rem' }}>{trackInfo?.artists?.map((artist) => artist.name).join(', ') || ''}</p>
          <img src={trackInfo?.album?.images?.[0]?.url || ''} alt='Album Cover' style={{ maxWidth: '90%', maxHeight: '90%', paddingBottom: '1.5rem' }} />
        </div>
        <div className='info-card'>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0' }}>{currentRecommendation?.like_count / currentRecommendation?.total_shown_count * 100}%</p>
          <p style={{ marginTop: '-1.5rem' }}>Of people who liked <strong>{song.name}</strong> like <strong>{trackInfo.name}</strong></p>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <div className='button-div' onClick={() => handleAction('dislike')}>
              <FaThumbsDown className='icon' color='black' size={30} />
            </div>
            <div className='button-div' onClick={() => handleAction('pass')}>
              <FaCircleQuestion color='black' size={30} />
            </div>
            <div className='button-div' onClick={() => handleAction('like')}>
              <FaThumbsUp color='black' size={30} />
            </div>
          </div>
        </div>
      </div>
      <p style={{ position: 'fixed', bottom: '0' }}>Created by <a href='http://www.lucasrobert.com' rel='noreferrer' target='_blank'>Lucas Robert</a><br />Powered by Spotify Developer APIs</p>
    </div>
  );
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
  }, [debouncedTerm, searchTerm])

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if(!e.target.value.trim()){
      setSongs([]);
    }
  }

  const handleCardClick = (song) => {
    console.log(song.id);
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
