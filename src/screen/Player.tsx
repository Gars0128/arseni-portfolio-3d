import { TRACK, useMusic } from '../music'

const SPOTIFY_EMBED = 'https://open.spotify.com/embed/track/3X7wz6EBdQbey8PIrSHXuP?utm_source=generator&theme=0'

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/** Spotify-style player window. */
export function Player() {
  const { available, playing, time, duration, volume, toggle, seek, setVolume } = useMusic()
  return (
    <div className="player">
      <div className={playing ? 'cover spin' : 'cover'} aria-hidden>
        <span>♫</span>
      </div>
      <div className="player-body">
        <p className="player-label">Now playing · from the desk speakers</p>
        <h2>{TRACK.title}</h2>
        <p className="player-artist">{TRACK.artist}</p>
        {available ? (
          <>
            <input
              className="player-seek"
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={time}
              onChange={(e) => seek(+e.target.value)}
              aria-label="Seek"
            />
            <div className="player-times">
              <span>{fmt(time)}</span>
              <span>{fmt(duration)}</span>
            </div>
            <div className="player-controls">
              <button className="player-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? '❚❚' : '▶'}
              </button>
              <label className="player-vol">
                🔊
                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(+e.target.value)} aria-label="Volume" />
              </label>
            </div>
          </>
        ) : (
          // public build has no local file: official Spotify embed (licensed playback) instead
          <iframe
            className="player-spotify"
            title={`${TRACK.title} — ${TRACK.artist} on Spotify`}
            src={SPOTIFY_EMBED}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        )}
      </div>
    </div>
  )
}

/** Small now-playing chip for the taskbar. */
export function NowPlaying({ onOpen }: { onOpen: () => void }) {
  const { available, playing, toggle } = useMusic()
  if (!available) return null
  return (
    <span className="np">
      <button onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? '❚❚' : '▶'}
      </button>
      <button className="np-title" onClick={onOpen}>
        {playing && <i className="eq" aria-hidden />}
        {TRACK.title} — {TRACK.artist}
      </button>
    </span>
  )
}
