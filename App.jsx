import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://eve-and-gavin-backend.onrender.com'); // Replace with your backend URL

export default function App() {
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [videoId, setVideoId] = useState('');
  const playerRef = useRef(null);
  const ytRef = useRef(null);

  useEffect(() => {
    window.onYouTubeIframeAPIReady = () => {
      ytRef.current = new window.YT.Player('yt-player', {
        height: '360',
        width: '640',
        videoId: '',
        events: {
          onReady: () => {},
          onStateChange: onPlayerStateChange
        }
      });
    };

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);

    socket.on('video-select', (id) => {
      ytRef.current.loadVideoById(id);
      setVideoId(id);
    });

    socket.on('play', (time) => {
      ytRef.current.seekTo(time, true);
      ytRef.current.playVideo();
    });

    socket.on('pause', (time) => {
      ytRef.current.seekTo(time, true);
      ytRef.current.pauseVideo();
    });

    socket.on('seek', (time) => {
      ytRef.current.seekTo(time, true);
    });

    return () => {
      socket.off('video-select');
      socket.off('play');
      socket.off('pause');
      socket.off('seek');
    };
  }, []);

  const joinRoom = () => {
    socket.emit('join-room', room);
    setJoined(true);
  };

  const selectVideo = () => {
    socket.emit('video-select', { room, videoId });
    ytRef.current.loadVideoById(videoId);
  };

  const handlePlay = () => {
    const time = ytRef.current.getCurrentTime();
    socket.emit('play', { room, time });
  };

  const handlePause = () => {
    const time = ytRef.current.getCurrentTime();
    socket.emit('pause', { room, time });
  };

  const handleSeek = () => {
    const time = ytRef.current.getCurrentTime();
    socket.emit('seek', { room, time });
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      handlePlay();
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      handlePause();
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      {!joined ? (
        <div className="flex flex-col gap-2">
          <input
            className="border p-2"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Enter Room Name"
          />
          <button onClick={joinRoom} className="bg-blue-500 text-white p-2 rounded">
            Join Room
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            className="border p-2"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="Enter YouTube Video ID (e.g. dQw4w9WgXcQ)"
          />
          <button onClick={selectVideo} className="bg-purple-500 text-white p-2 rounded">
            Load Video
          </button>
          <div id="yt-player" className="mt-4"></div>
        </div>
      )}
    </div>
  );
}
