# SONGR

***Due to Spotify recently deprecating some important developer APIs, this project has been put on hold.***

## Plans for now deprecated APIs
- Spotify 'Recommendations' API
  - Initially, Spotify's Recommendations API was to be used in order to supply the user with relevant song suggestions. Since the API was deprecated, a temporary solution was constructed. If a user searches for a song that has not been searched for before in the system, the 'Get Artists Top Tracks' API is called, displaying recommendations from the same artist to the user. However, if a song_interaction record exists in the database for the searched song, these recommendations will be shown instead.
- Spotify 'Preview URL' from Get Track API
  - Had the Preview URL not been deprecated, it would've been used to play a 30 second audio clip for each song that is displayed to the user, so they can listen to the song before deciding if they like it or not.
