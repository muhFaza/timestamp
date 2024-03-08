// Improved imports and removed unnecessary ones
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, SafeAreaView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Spacer, Lists, Clock, WorkTimeSetter } from './components';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use a constants file for fixed values like workTime default setting
const DEFAULT_WORK_TIME_MS = 9 * 60 * 60 * 1000; // 9 hours in milliseconds

export default function App() {
  // States initialization
  const [storageData, setStorageData] = useState([]);
  const [isCheckIn, setIsCheckIn] = useState(true);
  const [viewSavedTime, setViewSavedTime] = useState('');
  const [totalDuration, setTotalDuration] = useState('');
  const [totalDurationInMs, setTotalDurationInMs] = useState(0);
  const [totalReduced, setTotalReduced] = useState('');
  const [workTimeSet, setWorkTimeSet] = useState(DEFAULT_WORK_TIME_MS);

  const isDarkMode = useColorScheme() === 'dark';
  // Simplify the use of styles for dark and light modes
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const textStyle = {
    color: isDarkMode ? Colors.lighter : Colors.darker,
  };

  useEffect(() => {
    // This function is now cleaner and more modular
    async function loadCheckIns() {
      try {
        const [dataFromStorage, workTimeSetting] = await Promise.all([
          AsyncStorage.getItem('storageData'),
          AsyncStorage.getItem('workTimeSetting'),
        ]);

        const parsedData = dataFromStorage ? JSON.parse(dataFromStorage) : [];
        const workTime = workTimeSetting ? parseInt(workTimeSetting, 10) : DEFAULT_WORK_TIME_MS;

        // Calculate and update the state based on loaded data
        updateStateWithLoadedData(parsedData, workTime);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    loadCheckIns();
  }, []);

  const calculateTotalDuration = (dataFromStorage) => {
    const sum = dataFromStorage.reduce((acc, currentItem) => {
      if (typeof currentItem.totalDuration === 'number') {
        return acc + currentItem.totalDuration;
      }
      return acc;
    }, 0);
    return sum
  }

  // Refactored to a separate function to improve readability
  const updateStateWithLoadedData = (data, workTime) => {
    setStorageData(data);
    setWorkTimeSet(workTime);

    if (data.length > 0) {
      const lastCheckIn = data[0];
      setIsCheckIn(!!lastCheckIn.checkOut);
      setViewSavedTime(lastCheckIn.formattedDateOut || lastCheckIn.formattedDateIn);

      const totalDurationMs = calculateTotalDuration(data);
      setTotalDurationInMs(totalDurationMs);
      setTotalDuration(formatTotalDuration(totalDurationMs));

      // Calculate reduced total duration
      calculateAndSetTotalReduced(totalDurationMs, data.length, workTime);
    }
  };

  const calculateAndSetTotalReduced = (totalMs, days, workTime) => {
    const totalValidWorkTime = days * workTime;
    const durationMinusWorkTime = totalMs - totalValidWorkTime;
    setTotalReduced(formatTotalDuration(durationMinusWorkTime, true));
  };

  // Modified to handle negative duration correctly
  const formatTotalDuration = (ms, includeSign = false) => {
    let totalSeconds = Math.abs(ms) / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const sign = includeSign && ms < 0 ? '-' : '';
    return `${sign}${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const saveDataToStorage = useCallback(async (data) => {
    try {
      await AsyncStorage.setItem('storageData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [])
  
  const handleCheckinButton = useCallback(() => {
    // Simplified logic and refactored to improve clarity
    const date = new Date();
    const formattedDate = formatDate(date);

    const updatedData = isCheckIn ? handleCheckIn(date, formattedDate) : handleCheckOut(date, formattedDate);

    // Update state with the new or updated check-in/out
    setStorageData(updatedData);
    saveDataToStorage(updatedData);
    setIsCheckIn(!isCheckIn);
    setViewSavedTime(formattedDate);
  }, [isCheckIn, storageData, workTimeSet]);

  // TODO: possible id duplication if an item is deleted
  const handleCheckIn = (date, formattedDate) => {
    const newCheckIn = {
      // TODO: possible id duplication
      id: storageData.length,
      checkIn: date.getTime(),
      checkOut: false,
      formattedDateIn: formattedDate,
      formattedDateOut: false,
      totalDuration: false,
    };
    return [newCheckIn, ...storageData];
  };

  const handleCheckOut = (date, formattedDate) => {
    const updatedData = storageData.map((data, index) =>
      index === 0 ? {
        ...data,
        checkOut: date.getTime(),
        formattedDateOut: formattedDate,
        totalDuration: date.getTime() - data.checkIn,
      } : data
    );

    // Recalculate total duration and reduced duration
    const totalDurationMs = calculateTotalDuration(updatedData);
    setTotalDurationInMs(totalDurationMs);
    setTotalDuration(formatTotalDuration(totalDurationMs));
    calculateAndSetTotalReduced(totalDurationMs, updatedData.length, workTimeSet);

    return updatedData;
  };

  const formatDate = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
    });
  };

  // Refactored work time setter to simplify logic
  const onSaveWorkTimeSetter = useCallback((ms) => {
    const newWorkTime = parseInt(ms, 10);
    AsyncStorage.setItem('workTimeSetting', newWorkTime.toString());
    setWorkTimeSet(newWorkTime);
    calculateAndSetTotalReduced(totalDurationInMs, storageData.length, newWorkTime);
  }, [totalDurationInMs, storageData])

  // Component rendering with simplified JSX structure and styles
  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <Clock />
      <Spacer />
      <Button onPress={handleCheckinButton} title={isCheckIn ? 'Check In' : 'Check Out'} />
      <Spacer />
      <View>
        <Text style={textStyle}>Last Check {!isCheckIn ? 'In' : 'Out'}: {viewSavedTime || 'no data'}</Text>
        {totalDuration && <Text style={textStyle}>All Duration: {totalDuration}</Text>}
        {totalDuration && <Text style={textStyle}>Reduced Duration by Work Time: {totalReduced}</Text>}
      </View>
      <Spacer />
      <Lists storage={storageData} />
      <Spacer />
      <Text style={textStyle}>Current WorkTime Set: {formatTotalDuration(workTimeSet)}</Text>
      <WorkTimeSetter onSave={onSaveWorkTimeSetter} />
      <Button onPress={resetAppState} color="red" title="Reset" />
      <StatusBar style="auto" />
    </SafeAreaView>
  );

  // Resetting state and storage
  function resetAppState() {
    saveDataToStorage([]);
    setStorageData([]);
    setIsCheckIn(true);
    setViewSavedTime('');
    setTotalDuration('');
    setTotalDurationInMs(0);
    setTotalReduced('');
    AsyncStorage.multiRemove(['storageData', 'workTimeSetting']);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
