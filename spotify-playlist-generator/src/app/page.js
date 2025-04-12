"use client";

import { useState, useEffect } from "react";
import { getMoodFromConversation, getSongsFromPrompt } from "../utils/gemini";
import {
  getAuthorizationUrl,
  handleAuthorizationCode,
  createPlaylistForMood,
  createPlaylistWithSpecificSongs,
} from "../utils/spotify";

export default function App() {
  const [chat, setChat] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState(null);
  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // Check for authorization code in the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      handleAuthorizationCode(code)
        .then(() => {
          setAuthenticated(true);
          window.history.replaceState({}, document.title, "/"); // Clean up the URL
        })
        .catch((err) => {
          console.error("Error handling authorization code:", err);
          alert("Failed to authenticate with Spotify. Please try again.");
        });
    }
  }, []);

  const handleLogin = () => {
    const authUrl = getAuthorizationUrl();
    window.location.href = authUrl; // Redirect to Spotify login
  };

  const handleSubmit = async () => {
    if (!authenticated) {
      alert("Please log in to Spotify first.");
      return;
    }

    setLoading(true);
    setPlaylistUrl(null);
    setMood(null);

    try {
      const moodResult = await getMoodFromConversation(chat);
      const songs = await getSongsFromPrompt(moodResult);
      // const playlist = await createPlaylistForMood(moodResult);
      const playlist = await createPlaylistWithSpecificSongs(moodResult, songs);
      setMood(moodResult);
      setPlaylistUrl(playlist);
    } catch (err) {
      console.error("Error generating playlist:", err);
      alert("Something went wrong! Check the console for more info.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-4xl font-bold mb-4 text-center text-green-600">
          🎧 VibeCraft
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Tell me how you feel. I’ll craft a playlist for your mood.
        </p>

        {!authenticated ? (
          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition"
          >
            Log in to Spotify 🎵
          </button>
        ) : (
          <>
            <textarea
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              placeholder="Today felt like a rollercoaster..."
              className="w-full h-40 border border-gray-300 rounded-lg p-3 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <button
              onClick={handleSubmit}
              disabled={loading || !chat.trim()}
              className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition disabled:opacity-50"
            >
              {loading ? "Analyzing your vibe..." : "Generate Playlist 🎶"}
            </button>
          </>
        )}

        {mood && (
          <div className="mt-6 text-center">
            <p className="text-lg text-gray-700">We felt your mood was:</p>
            <p className="text-2xl font-semibold text-green-600 capitalize">
              {mood}
            </p>
          </div>
        )}

        {playlistUrl && (
          <div className="mt-4 text-center">
            <a
              href={playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-blue-500 hover:underline"
            >
              Open your Spotify playlist 🔗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
