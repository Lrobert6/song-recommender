const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Spotify API Credentials
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

let accessToken = null;
let tokenExpiresAt = null;

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to get Spotify Access Token
async function getAccessToken() {
  if (accessToken && tokenExpiresAt > Date.now()) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "client_credentials",
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiresAt = Date.now() + response.data.expires_in * 1000;
    return accessToken;
  } catch (error) {
    console.error("Error fetching Spotify access token:", error.response.data);
    throw new Error("Failed to fetch access token");
  }
}

// Route to search for songs
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).send("Query parameter 'q' is required");
  }

  try {
    const token = await getAccessToken();
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(response.data.tracks.items);
  } catch (error) {
    console.error("Error searching Spotify:", error.response?.data || error);
    res.status(500).send("Failed to search Spotify");
  }
});

// Route to get track information
app.get("/api/get-track", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).send("Query parameter 'q' is required");
  }

  try {
    const token = await getAccessToken();
    const response = await axios.get(
      `https://api.spotify.com/v1/tracks/${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error searching Spotify:", error.response?.data || error);
    res.status(500).send("Failed to search Spotify");
  }
});

// Route to log song interactions
app.post("/api/log-action", async (req, res) => {
  const { baseSongID, relatedSongID, action } = req.body;

  console.log("Request body:", { baseSongID, relatedSongID, action });

  if (!baseSongID || !relatedSongID || !action) {
    return res.status(400).send("Missing parameters");
  }

  try {
    const { data, error } = await supabase.rpc("update_song_interaction", {
      base_song_id_param: baseSongID,
      related_song_id_param: relatedSongID,
      action_type: action,
    });

    if (error) {
      throw error;
    }

    return res.status(200).send("Action logged");
  } catch (error) {
    console.error("Error logging action:", error.message);
    res.status(500).send("Failed to log action");
  }
});

// Route to get recommendations
// app.get('/api/recommendations', async (req, res) => {
//   const { songId } = req.query;

//   if (!songId) {
//     console.error('No songId provided');
//     return res.status(400).json({ error: 'songId is required' }); // JSON response
//   }

//   try {
//     const { data, error } = await supabase
//       .from("song_interactions")
//       .select("related_song_id, like_count, total_shown_count")
//       .eq("base_song_id", songId)
//       .order('like_percentage', {ascending: false})
//       .limit(10);
//       // .filter("total_shown_count", "gt", 0);

//     if (error) {
//       console.error('Supabase error:', error.message);
//       return res.status(500).json({ error: 'Failed to fetch recommendations' });
//     }

//     console.log('Supabase data:', data);
//     console.log('Supabase error:', error);

//     if (data.length === 0) {
//       console.log('No recommendations found');
//       return res.json([]); // Send empty JSON array
//     }

//     console.log('Recommendations:', data);
//     res.setHeader("Content-Type", "application/json");
//     res.json(data); // Send data as JSON
//   } catch (error) {
//     console.error('Error fetching recommendations:', error.message);
//     res.status(500).json({ error: 'Internal server error' }); // JSON response
//   }
// });

app.get('/api/recommendations', async (req, res) => {
  const { songId } = req.query;

  if (!songId) {
    return res.status(400).json({ error: 'songId is required' });
  }

  try {
    // Step 1: Check if recommendations exist in the database
    let { data: recommendations, error } = await supabase
      .from('song_interactions')
      .select('related_song_id, like_count, total_shown_count')
      .eq('base_song_id', songId)
      .order('like_percentage', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch recommendations' });
    }

    // Step 2: If no recommendations exist, fetch them using Spotify's Top Tracks API
    if (!recommendations || recommendations.length === 0) {
      console.log(`No recommendations found for songId ${songId}. Fetching using Top Tracks API...`);

      const token = await getAccessToken();

      // Get the song's artist(s)
      const trackResponse = await axios.get(
        `https://api.spotify.com/v1/tracks/${encodeURIComponent(songId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const primaryArtistId = trackResponse.data.artists[0].id;

      // Fetch the artist's top tracks
      const topTracksResponse = await axios.get(
        `https://api.spotify.com/v1/artists/${primaryArtistId}/top-tracks?market=US`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const topTracks = topTracksResponse.data.tracks.map((track) => ({
        base_song_id: songId,
        related_song_id: track.id,
        like_count: 0,
        dislike_count: 0,
        pass_count: 0,
        total_shown_count: 0,
      }));

      // Step 3: Insert Top Tracks into the database
      const { error: insertError } = await supabase
        .from('song_interactions')
        .insert(topTracks);

      if (insertError) {
        console.error('Error inserting recommendations into Supabase:', insertError.message);
        return res.status(500).json({ error: 'Failed to store recommendations' });
      }

      recommendations = topTracks; // Use the newly generated recommendations
    }

    // Step 4: Return the recommendations to the user
    res.setHeader('Content-Type', 'application/json');
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const path = require("path");

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "build")));

// Catch-all route to serve the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
