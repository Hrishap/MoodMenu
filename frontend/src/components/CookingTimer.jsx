import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Clock } from 'lucide-react';

const CookingTimer = ({ timer, onRemove, soundEnabled }) => {
  const [timeLeft, setTimeLeft] = useState(timer.remaining);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize audio for timer completion
  useEffect(() => {
    // Create audio object for notification sound
    audioRef.current = new Audio('/timer-complete.mp3');
    audioRef.current.preload = 'auto';
    
    // Fallback if no audio file
    if (!audioRef.current.canPlayType('audio/mpeg')) {
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            playNotification();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  const playNotification = () => {
    if (soundEnabled) {
      // Try to play custom sound
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Fallback to system notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
              body: `${timer.name} timer has finished`,
              icon: '/favicon.ico'
            });
          }
        });
      }

      // Browser beep as last resort
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);
      } catch (e) {
        console.log('Audio notification not supported');
      }
    }
  };

  const toggleTimer = () => {
    if (isComplete) {
      // Reset timer
      setTimeLeft(timer.duration);
      setIsComplete(false);
      setIsRunning(false);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const resetTimer = () => {
    setTimeLeft(timer.duration);
    setIsRunning(false);
    setIsComplete(false);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((timer.duration - timeLeft) / timer.duration) * 100;

  return (
    <div className={`bg-white rounded-lg border-2 p-4 ${
      isComplete ? 'border-green-500 bg-green-50' : 
      isRunning ? 'border-primary-500' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-900">{timer.name}</span>
        </div>
        <button
          onClick={() => onRemove(timer.id)}
          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative w-20 h-20 mx-auto mb-4">
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className={isComplete ? 'text-green-500' : 'text-primary-500'}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-mono font-bold ${
            isComplete ? 'text-green-600' : 'text-gray-900'
          }`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {isComplete && (
        <div className="text-center mb-3">
          <div className="text-green-600 font-semibold animate-pulse">
            ✅ Complete!
          </div>
        </div>
      )}

      <div className="flex justify-center space-x-2">
        <button
          onClick={toggleTimer}
          className={`p-2 rounded-lg transition-colors ${
            isComplete 
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : isRunning 
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
              : 'bg-primary-500 hover:bg-primary-600 text-white'
          }`}
        >
          {isComplete ? <RotateCcw className="h-4 w-4" /> :
           isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={resetTimer}
          className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CookingTimer;
