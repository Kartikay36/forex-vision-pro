
import { useState, useEffect } from 'react';

export const useMarketHours = () => {
  const [isMarketOpen, setIsMarketOpen] = useState(true);
  const [nextMarketEvent, setNextMarketEvent] = useState('');
  const [marketSessions, setMarketSessions] = useState<any[]>([]);

  useEffect(() => {
    const checkMarketHours = () => {
      const now = new Date();
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      
      // Major forex sessions (UTC times)
      const sessions = [
        { name: 'Sydney', open: 21, close: 6, timezone: 'GMT+10' },
        { name: 'Tokyo', open: 0, close: 9, timezone: 'GMT+9' },
        { name: 'London', open: 8, close: 17, timezone: 'GMT+0' },
        { name: 'New York', open: 13, close: 22, timezone: 'GMT-5' }
      ];
      
      const currentHour = new Date(utcTime).getUTCHours();
      
      // Forex market is open 24/5 (Monday to Friday)
      const dayOfWeek = now.getUTCDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Check if it's Friday evening or Monday morning
      const isFridayEvening = dayOfWeek === 5 && currentHour >= 22;
      const isMondayMorning = dayOfWeek === 1 && currentHour < 22;
      
      const marketOpen = !isWeekend && !isFridayEvening;
      setIsMarketOpen(marketOpen);
      
      // Calculate next market event
      if (marketOpen) {
        if (dayOfWeek === 5) {
          setNextMarketEvent('Market closes in ' + (22 - currentHour) + 'h');
        } else {
          setNextMarketEvent('Market open - Next close: Friday 22:00 UTC');
        }
      } else {
        if (dayOfWeek === 0) {
          setNextMarketEvent('Market opens Monday 22:00 UTC');
        } else if (dayOfWeek === 6) {
          const hoursUntilMonday = (24 - currentHour) + 24 + 22;
          setNextMarketEvent(`Market opens in ${hoursUntilMonday}h`);
        } else {
          setNextMarketEvent('Market opens Monday 22:00 UTC');
        }
      }
      
      // Update session status
      const activeSessions = sessions.map(session => ({
        ...session,
        isActive: isSessionActive(session, currentHour)
      }));
      
      setMarketSessions(activeSessions);
    };

    checkMarketHours();
    const interval = setInterval(checkMarketHours, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  return { isMarketOpen, nextMarketEvent, marketSessions };
};

const isSessionActive = (session: any, currentHour: number) => {
  if (session.open < session.close) {
    return currentHour >= session.open && currentHour < session.close;
  } else {
    // Session spans midnight
    return currentHour >= session.open || currentHour < session.close;
  }
};
