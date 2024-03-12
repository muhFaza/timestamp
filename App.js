// Improved imports and removed unnecessary ones
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Dimensions, SafeAreaView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Spacer, Lists, Clock, WorkTimeSetter, ExportButton, ImportButton } from './components';

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
  const [checkInTime, setCheckInTime] = useState(null);
  const [passedTime, setPassedTime] = useState('');
  const [timeLeft, setTimeLeft] = useState('');


  const isDarkMode = useColorScheme() === 'dark';
  // Simplify the use of styles for dark and light modes
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const textStyle = {
    color: isDarkMode ? Colors.lighter : Colors.darker,
  };

  useEffect(() => {
    let intervalId;

    if (checkInTime) {
      intervalId = setInterval(() => {
        const now = new Date().getTime();
        const passedTimeMs = now - checkInTime;
        const timeLeftMs = workTimeSet - passedTimeMs;
        setPassedTime(formatTotalDuration(passedTimeMs));
        setTimeLeft(formatTotalDuration(timeLeftMs, true));
      }, 1000); // Update every second
    }

    return () => clearInterval(intervalId); // Cleanup on component unmount or when checkInTime changes
  }, [checkInTime, workTimeSet]);


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
      setCheckInTime(!!lastCheckIn.checkOut ? null : lastCheckIn.checkIn)
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
    setCheckInTime(date.getTime())
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
    setCheckInTime(null)
    const updatedData = storageData.map((data, index) =>
      index === 0 ? {
        ...data,
        checkOut: data.checkOut ? data.checkOut : date.getTime(),
        formattedDateOut: data.formattedDateOut ? data.formattedDateOut : formattedDate,
        totalDuration: data.totalDuration ? data.totalDuration : date.getTime() - data.checkIn,
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

  const onDelete = (index) => {
    const updatedData = storageData.filter((_, i) => i !== index);
    setStorageData(updatedData);
    saveDataToStorage(updatedData); // Assuming saveDataToStorage correctly saves to AsyncStorage

    const totalDurationMs = calculateTotalDuration(updatedData);
    setTotalDurationInMs(totalDurationMs);
    setTotalDuration(formatTotalDuration(totalDurationMs));
    calculateAndSetTotalReduced(totalDurationMs, updatedData.length, workTimeSet);

    if (!isCheckIn && index === 0) {
      setIsCheckIn(true)
      setCheckInTime(null)
    }
  };


  const showDeleteConfirmation = (index) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        { text: "OK", onPress: () => onDelete(index) }
      ],
      { cancelable: true }
    );
  };

  const showResetConfirmation = () => {
    Alert.alert(
      "Reset Data",
      "Are you sure you want to reset all data? This action cannot be undone.",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        { text: "OK", onPress: resetAppState }
      ],
      { cancelable: true }
    );
  };

  const importPlacementAlert = (data) => {
    if (!storageData.length) return pushNewData(data)
    Alert.alert('Choose Data Placement', 'Should we put the imported data to the front or back of the current data?', [
      {
        text: "Front",
        onPress: () => pushNewData(data, 1),
      },
      {
        text: "Back",
        onPress: () => pushNewData(data, 0),
      },
      {
        text: "Decide for me",
        onPress: () => pushNewData(data),
      }
    ], { cancelable: true })
  }

  // front = -1 let algo decide
  // front = 1 push to front
  // front = 0 push to back
  const pushNewData = (newData, front = -1) => {
    let placement;
    // onDataImported(data);

    // if current data is empty
    if (!storageData.length) {
      saveDataToStorage(newData)
      setStorageData(newData)
      setIsCheckIn(!!newData[0].checkOut);
      setCheckInTime(!!newData[0].checkOut ? null : newData[0].checkIn)
      setViewSavedTime(newData[0].formattedDateOut || newData[0].formattedDateIn);

      const totalDurationMs = calculateTotalDuration(newData);
      setTotalDurationInMs(totalDurationMs);
      setTotalDuration(formatTotalDuration(totalDurationMs));
      calculateAndSetTotalReduced(totalDurationMs, newData.length, workTimeSet);
    }
    // push to front
    else if (front == 1) {
      const compiledData = [...newData, ...storageData]
      saveDataToStorage(compiledData)
      setStorageData(compiledData)
      setIsCheckIn(!!compiledData[0].checkOut);
      setCheckInTime(!!compiledData[0].checkOut ? null : compiledData[0].checkIn)
      setViewSavedTime(compiledData[0].formattedDateOut || compiledData[0].formattedDateIn);

      const totalDurationMs = calculateTotalDuration(compiledData);
      setTotalDurationInMs(totalDurationMs);
      setTotalDuration(formatTotalDuration(totalDurationMs));
      calculateAndSetTotalReduced(totalDurationMs, compiledData.length, workTimeSet);
    }
    // push to back
    else if (front == 0) {
      const compiledData = [...storageData, ...newData]
      saveDataToStorage(compiledData)
      setStorageData(compiledData)
      setIsCheckIn(!!compiledData[0].checkOut);
      setCheckInTime(!!compiledData[0].checkOut ? null : compiledData[0].checkIn)
      setViewSavedTime(compiledData[0].formattedDateOut || compiledData[0].formattedDateIn);

      const totalDurationMs = calculateTotalDuration(compiledData);
      setTotalDurationInMs(totalDurationMs);
      setTotalDuration(formatTotalDuration(totalDurationMs));
      calculateAndSetTotalReduced(totalDurationMs, compiledData.length, workTimeSet);
    }
    // decide based on last current data and newest imported data
    else if (front == -1) {
      console.log('decide: ', parseInt(storageData[storageData.length - 1].checkIn) > parseInt(newData[0].checkIn))
      let compiledData = parseInt(storageData[storageData.length - 1].checkIn) > parseInt(newData[0].checkIn) ? [...storageData, ...newData] : [...newData, ...storageData]
      saveDataToStorage(compiledData)
      setStorageData(compiledData)
      setIsCheckIn(!!compiledData[0].checkOut);
      setCheckInTime(!!compiledData[0].checkOut ? null : compiledData[0].checkIn)
      setViewSavedTime(compiledData[0].formattedDateOut || compiledData[0].formattedDateIn);

      const totalDurationMs = calculateTotalDuration(compiledData);
      setTotalDurationInMs(totalDurationMs);
      setTotalDuration(formatTotalDuration(totalDurationMs));
      calculateAndSetTotalReduced(totalDurationMs, compiledData.length, workTimeSet);
    }
  }

  const _renderWorkTimer = () => {
    return (<React.Fragment>
      <Spacer vertical={10} horizontal={0} />
      <Text style={textStyle}>Work Time</Text>
      <Text style={textStyle}>Passed: {passedTime} || Left: {timeLeft}</Text>
      <Spacer vertical={10} horizontal={0} />
    </React.Fragment>)
  }

  // Component rendering with simplified JSX structure and styles
  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <Clock />
      <Spacer />
      <Button onPress={handleCheckinButton} title={isCheckIn ? 'Check In' : 'Check Out'} />
      <Spacer />
      <View>
        <Text style={textStyle}>Last Check {!isCheckIn ? 'In' : 'Out'}: {viewSavedTime || 'no data'}</Text>
        {!isCheckIn && _renderWorkTimer()}
        {totalDuration && <Text style={textStyle}>All Duration: {totalDuration}</Text>}
        {totalDuration && <Text style={textStyle}>Reduced Duration by Work Time: {totalReduced}</Text>}
      </View>
      <Spacer />
      <Lists storage={storageData} onDelete={showDeleteConfirmation} />
      <Spacer />
      <Text style={textStyle}>Current WorkTime Set: {formatTotalDuration(workTimeSet)}</Text>
      <WorkTimeSetter onSave={onSaveWorkTimeSetter} />
      <View style={styles.row}>
        <ImportButton onImportAlert={importPlacementAlert} />
        <Spacer vertical={0} horizontal={10} />
        <ExportButton data={storageData} />
        <Spacer vertical={0} horizontal={10} />
        <Button onPress={showResetConfirmation} color="red" title="Reset" />
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );

  // Resetting state and storage
  function resetAppState() {
    saveDataToStorage([]);
    setStorageData([]);
    setIsCheckIn(true);
    setCheckInTime(null)
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
  row: {
    width: Dimensions.get('screen').width,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
