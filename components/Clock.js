import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, useColorScheme } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";

const Clock = () => {
  const [currentDateTime, setCurrentDateTime] = useState({
    time: '',
    date: '',
  });

  const isDarkMode = useColorScheme() === 'dark'
  const textColor = useMemo(() => ({
    color: isDarkMode ? Colors.lighter : Colors.darker,
  }), [isDarkMode]);

  useEffect(() => {
    const formatTime = (now) => {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const isAm = hours < 12;

      return [
        ((hours + 11) % 12) + 1,
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0'),
      ].join(':') + (isAm ? ' AM' : ' PM');
    };

    const formatDate = (now) => {
      return now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Update Time every second
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(prev => ({
        time: formatTime(now),
        date: prev.date
      }))
    };

    // Set initial Date and Time
    const now = new Date();
    setCurrentDateTime({
      time: formatTime(now),
      date: formatDate(now),
    });

    const timeInterval = setInterval(updateTime, 1000);

    // Update Date at midnight
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Set to next midnight
    const updateDateAtMidnight = () => setCurrentDateTime(prev => ({
      time: prev.time,
      date: formatDate(new Date())
    }));
    const tillMidnight = midnight.getTime() - now.getTime();
    const dateTimeout = setTimeout(() => {
      updateDateAtMidnight();
      setInterval(updateDateAtMidnight, 86400000); // Update Date every 24 hours after the first timeout
    }, tillMidnight);

    return () => {
      clearInterval(timeInterval);
      clearTimeout(dateTimeout);
    };
  }, []);

  return (
    <>
      <Text style={[styles.dateText, textColor]}>{currentDateTime.date}</Text>
      <Text style={[styles.timeText, textColor]}>{currentDateTime.time}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  timeText: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default Clock;
