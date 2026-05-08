type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
  id: string;
  time: Date;
  level: LogLevel;
  message: string;
  details?: string;
}

const logs: LogEntry[] = [];
let listeners: Array<(logs: LogEntry[]) => void> = [];

export const addLog = (level: LogLevel, message: string, details?: any) => {
  let detailsString = undefined;
  if (details) {
    if (typeof details === 'string') {
      detailsString = details;
    } else if (details instanceof Error) {
      detailsString = details.toString();
    } else {
      try {
        detailsString = JSON.stringify(details, null, 2);
      } catch (e) {
        detailsString = String(details);
      }
    }
  }

  const newLog: LogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    time: new Date(),
    level,
    message,
    details: detailsString
  };
  
  logs.unshift(newLog);
  // Keep only last 100 logs
  if (logs.length > 100) {
    logs.pop();
  }
  listeners.forEach(listener => listener([...logs]));
};

export const subscribeLogs = (listener: (logs: LogEntry[]) => void) => {
  listeners.push(listener);
  listener([...logs]); // initial call
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

export const clearLogs = () => {
  logs.length = 0;
  listeners.forEach(listener => listener([...logs]));
};
