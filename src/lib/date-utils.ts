// src/lib/date-utils.ts
export const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format date for message groups
export const formatMessageDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if date is today
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  // Check if date is yesterday
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  // Otherwise return the date
  return date.toLocaleDateString();
};
