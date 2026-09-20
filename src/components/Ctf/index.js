import React, {useEffect, useState} from 'react';
import {getToken, getStoredUsername, clearSession, fetchChallenges, fetchMe} from './api';
import AuthPanel from './AuthPanel';
import ChallengeList from './ChallengeList';
import ChallengeModal from './ChallengeModal';
import Scoreboard from './Scoreboard';
import styles from './styles.module.css';

export default function Ctf() {
  const [username, setUsername] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [tab, setTab] = useState('challenges'); // 'challenges' | 'scoreboard'
  const [challenges, setChallenges] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [selected, setSelected] = useState(null);
  const [points, setPoints] = useState(0);

  // On mount, if a token is already stored, verify it's still valid rather
  // than trusting the cached username blindly.
  useEffect(() => {
    const token = getToken();
    const storedUsername = getStoredUsername();
    if (!token || !storedUsername) {
      setCheckingSession(false);
      return;
    }
    fetchMe()
      .then((me) => {
        setUsername(me.username);
        setPoints(me.points);
      })
      .catch(() => clearSession())
      .finally(() => setCheckingSession(false));
  }, []);

  function loadChallenges() {
    setLoadState('loading');
    fetchChallenges()
      .then((data) => {
        setChallenges(data.challenges);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }

  useEffect(() => {
    if (!checkingSession) loadChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingSession, username]);

  function handleAuthenticated(name) {
    setUsername(name);
  }

  function handleLogout() {
    clearSession();
    setUsername(null);
    setPoints(0);
  }

  function handleSolved(challengeId) {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== challengeId) return c;
        setPoints((p) => p + c.points);
        return {...c, solved: true};
      }),
    );
  }

  if (checkingSession) {
    return <p className={styles.emptyNote}>Loading…</p>;
  }

  if (!username) {
    return <AuthPanel onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div>
      <div className={styles.statusBar}>
        <span>
          Logged in as <strong>{username}</strong> · {points} points
        </span>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          Log out
        </button>
      </div>

      <div className={styles.ctfTabs}>
        <button type="button" className={styles.ctfTab} data-active={tab === 'challenges'} onClick={() => setTab('challenges')}>
          Challenges
        </button>
        <button type="button" className={styles.ctfTab} data-active={tab === 'scoreboard'} onClick={() => setTab('scoreboard')}>
          Scoreboard
        </button>
      </div>

      {tab === 'challenges' && (
        <>
          {loadState === 'loading' && <p className={styles.emptyNote}>Loading challenges…</p>}
          {loadState === 'error' && <p className={styles.emptyNote}>Couldn't load challenges. Try refreshing.</p>}
          {loadState === 'ready' && <ChallengeList challenges={challenges} onSelect={setSelected} />}
        </>
      )}

      {tab === 'scoreboard' && <Scoreboard currentUsername={username} />}

      {selected && (
        <ChallengeModal
          challenge={selected}
          onClose={() => setSelected(null)}
          onSolved={handleSolved}
        />
      )}
    </div>
  );
}
