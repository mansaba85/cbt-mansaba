import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface IdleTimerProps {
  timeoutMinutes?: number;
}

const IdleTimer: React.FC<IdleTimerProps> = ({ timeoutMinutes = 30 }) => {
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    console.log("Idle timeout triggered, logging out...");
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleLogout, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [timeoutMinutes]);

  return null; // Component ini hanya menjalankan logika di background
};

export default IdleTimer;
