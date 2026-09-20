import React, {useState} from 'react';
import {login, register, setSession} from './api';
import styles from './styles.module.css';

export default function AuthPanel({onAuthenticated}) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({state: 'idle', error: null});

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({state: 'loading', error: null});
    try {
      const fn = mode === 'login' ? login : register;
      const data = await fn(username.trim(), password);
      setSession(data.token, data.username);
      onAuthenticated(data.username);
    } catch (err) {
      setStatus({state: 'idle', error: err.message});
      return;
    }
    setStatus({state: 'idle', error: null});
  }

  return (
    <div className={styles.authPanel}>
      <div className={styles.authModeTabs}>
        <button
          type="button"
          className={styles.authModeTab}
          data-active={mode === 'login'}
          onClick={() => setMode('login')}>
          Log in
        </button>
        <button
          type="button"
          className={styles.authModeTab}
          data-active={mode === 'register'}
          onClick={() => setMode('register')}>
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.authForm}>
        <label className={styles.authLabel}>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.authInput}
            autoComplete="username"
            required
            minLength={3}
            maxLength={20}
          />
        </label>
        <label className={styles.authLabel}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.authInput}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={8}
          />
        </label>

        {status.error && <p className={styles.authError}>{status.error}</p>}

        <button type="submit" className={styles.authSubmit} disabled={status.state === 'loading'}>
          {status.state === 'loading' ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
