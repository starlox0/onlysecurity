import React, {useEffect, useState} from 'react';
import {fetchScoreboard} from './api';
import styles from './styles.module.css';

export default function Scoreboard({currentUsername}) {
  const [state, setState] = useState({status: 'loading', rows: []});

  useEffect(() => {
    fetchScoreboard()
      .then((data) => setState({status: 'ready', rows: data.scoreboard}))
      .catch(() => setState({status: 'error', rows: []}));
  }, []);

  if (state.status === 'loading') return <p className={styles.emptyNote}>Loading scoreboard…</p>;
  if (state.status === 'error') return <p className={styles.emptyNote}>Couldn't load the scoreboard.</p>;
  if (state.rows.length === 0) return <p className={styles.emptyNote}>No solves yet — be the first!</p>;

  return (
    <table className={styles.scoreTable}>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        {state.rows.map((row, i) => (
          <tr key={row.username} data-me={row.username === currentUsername}>
            <td>{i + 1}</td>
            <td>{row.username}</td>
            <td>{row.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
