import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, useColorScheme } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";

const Clock = () => {
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')

  
  const isDarkMode = useColorScheme() === 'dark'
  const textColor = useMemo(() => ({
    color: isDarkMode ? Colors.lighter : Colors.darker,
  }), [isDarkMode])

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const isAm = hours < 12;
      
      // Format: Convert 24hr to 12hr format, pad with zeros, show AM/PM
      const formattedTime = [
        ((hours + 11) % 12) + 1, // Convert 24hr to 12hr format
        minutes < 10 ? '0' + minutes : minutes,
        seconds < 10 ? '0' + seconds : seconds,
      ].join(':') + (isAm ? ' AM' : ' PM');

      setCurrentTime(formattedTime);
    };

    const updateDate = () => {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const date = now.toLocaleDateString('en-US', options);
      setCurrentDate(date)
    }

    updateClock(); // Initial call to display time immediately
    updateDate()

    const timerId = setInterval(updateClock, 1000); // Update time every second
    const dateId = setInterval(updateDate, 10000); // Update time every 10 second

    return () => {
      clearInterval(timerId); // Cleanup time interval on component unmount
      clearInterval(dateId); // Cleanup date interval on component unmount
    };
  }, []);

  return (
    <React.Fragment>
      <Text style={[styles.dateText, textColor]}>{currentDate}</Text>
      <Text style={[styles.timeText, textColor]}>{currentTime}</Text>
    </React.Fragment>
  )
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

export default Clock