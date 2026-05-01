'use client';
import { useState } from 'react';

export default function NotifyForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  if (submitted) {
    return (
      <>
        <div className="notify-title" style={{ color: 'var(--accent)' }}>You're on the list.</div>
        <div className="notify-sub">We'll reach out the moment it goes live.</div>
      </>
    );
  }
  return (
    <form
      className="notify-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (email) setSubmitted(true);
      }}
    >
      <input
        type="email"
        className="notify-input"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="notify-button" type="submit">Notify me</button>
    </form>
  );
}
