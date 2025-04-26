
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  duration: number; // in seconds
  isActive: boolean;
  onTimeout?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  duration, 
  isActive, 
  onTimeout 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          onTimeout && onTimeout();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, duration, onTimeout]);

  if (!isActive) return null;

  return (
    <div className="inline-flex items-center bg-red-100 text-red-800 px-2 py-0.5 rounded-md ml-2 text-xs font-medium">
      <Clock className="w-3 h-3 mr-1" />
      {timeLeft}s
    </div>
  );
};

export default CountdownTimer;
