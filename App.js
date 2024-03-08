import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, SafeAreaView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Spacer, Lists, Clock, WorkTimeSetter } from './components';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  /*
  * AsyncStorage: storageData contain json of the user data check in/out
  * AsyncStorage: workTimeSetting contain number in ms of the user worktime setting
  *  
  * viewSavedTime stores the last date string of checkin/checkout
  * totalDuration stores the all total duration in date string
  * totalReduced stores the all duration time minus the worktime * data.length
  * workTimeSet stores the workTime set in number ms !default to 9hr / 32,400,000 ms
  */
  const [storageData, setStorageData] = useState([])
  const [isCheckIn, setIsCheckIn] = useState(true)
  const [viewSavedTime, setViewSavedTime] = useState('')
  const [totalDuration, setTotalDuration] = useState('')
  const [totalDurationInMs, setTotalDurationInMs] = useState(0)
  const [totalReduced, setTotalReduced] = useState('')
  const [workTimeSet, setWorkTimeSet] = useState(0)

  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const textColor = {
    color: isDarkMode ? Colors.lighter : Colors.darker,
    textAlign: 'left'
  }

  useEffect(() => {
    // Load saved check-ins from AsyncStorage when component mounts
    const loadCheckIns = async () => {
      try {
        const [dataFromStorageJSON, loadWorktime] = await Promise.all([
          AsyncStorage.getItem('storageData'),
          AsyncStorage.getItem('workTimeSetting'),
        ]);

        let totalDurationMs;
        if (dataFromStorageJSON !== null) {
          const dataFromStorage = JSON.parse(dataFromStorageJSON);
          setStorageData(dataFromStorage);

          const lastCheckIn = dataFromStorage[dataFromStorage.length - 1];
          if (lastCheckIn) {
            // Determine check-in status and set the view time based on the last check-in
            setIsCheckIn(lastCheckIn.checkOut ? true : false);
            setViewSavedTime(lastCheckIn.formattedDateOut || lastCheckIn.formattedDateIn);
          }

          // Calculate total duration and set it
          totalDurationMs = calculateTotalDuration(dataFromStorage);
          setTotalDurationInMs(totalDurationMs);
          setTotalDuration(formatTotalDuration(totalDurationMs));
        }

        if (loadWorktime !== null) {
          setWorkTimeSet(loadWorktime)
        } else {
          setWorkTimeSet(32400000)
        }

        const days = storageData.length
        const totalValidWorkTime = days * workTimeSet
        const durationMinusWorkTime = totalDurationMs - totalValidWorkTime
        setTotalReduced(durationMinusWorkTime < 0 ? ` -${formatTotalDuration(durationMinusWorkTime)}` : formatTotalDuration(durationMinusWorkTime))
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    const loadWorkTimeSetting = async () => {
      try {
        const loadWorktime = await AsyncStorage.getItem('workTimeSetting');
        if (loadWorktime !== null) {
          setWorkTimeSet(loadWorktime)
        }
      } catch (error) {
        console.error('Error loading Work Time Setting')
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

  const formatTotalDuration = useCallback((allTotalDuration) => {
    let totalSeconds = Math.abs(allTotalDuration) / 1000; // Convert to seconds and ensure positive
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    // Formatting to "hr:min:sec"
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }, [])


  const saveDataToStorage = useCallback(async (data) => {
    try {
      await AsyncStorage.setItem('storageData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [])

  const handleCheckinButton = useCallback(() => {
    const date = new Date();
    const formattedDate = date.toLocaleString('en-US', {
      weekday: 'long', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
    });

    let updatedData;
    // When check in
    if (isCheckIn) {
      const newId = storageData.length;
      const newData = { id: newId, checkIn: date.getTime(), checkOut: false, formattedDateIn: formattedDate, formattedDateOut: false, totalDuration: false };
      updatedData = [newData, ...storageData];
    }
    // When check out 
    else {
      updatedData = storageData.map((data, index) =>
        index === 0 ? { ...data, checkOut: date.getTime(), formattedDateOut: formattedDate, totalDuration: date.getTime() - data.checkIn } : data
      );

      const totalDurationMs = calculateTotalDuration(updatedData)
      setTotalDurationInMs(totalDurationMs)
      setTotalDuration(formatTotalDuration(totalDurationMs))

      
      const days = updatedData.length
      const totalValidWorkTime = days * workTimeSet
      const durationMinusWorkTime = totalDurationMs - totalValidWorkTime
      setTotalReduced(durationMinusWorkTime < 0 ? ` -${formatTotalDuration(durationMinusWorkTime)}` : formatTotalDuration(durationMinusWorkTime))
    }

    setStorageData(updatedData);
    saveDataToStorage(updatedData);
    setIsCheckIn(!isCheckIn);
    setViewSavedTime(formattedDate);
  }, [isCheckIn, storageData]);

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <Clock />
      <Spacer />
      <Button onPress={handleCheckinButton} title={isCheckIn ? 'Check In' : 'Check Out'}></Button>
      <Spacer />
      <View>
        <Text style={textColor}>Last Check {!isCheckIn ? 'In' : 'Out'}: {viewSavedTime ? viewSavedTime : 'no data'}</Text>
        {totalDuration !== '' ? <Text style={textColor}>All Duration: {totalDuration}</Text> : null}
        {totalDuration !== '' ? <Text style={textColor}>All Duration Reduced by Work Time: {totalReduced}</Text> : null}
      </View>
      <Spacer />
      <Lists storage={storageData} />
      <Spacer />

      <Text style={[textColor]}>Current WorkTime Set: {formatTotalDuration(workTimeSet)}</Text>
      <WorkTimeSetter />
      <Button
        onPress={() => {
          saveDataToStorage([])
          setStorageData([])
          setIsCheckIn(true)
          setViewSavedTime('')
          setTotalDuration('')
          setTotalDurationInMs(0)
          setTotalReduced('')
          AsyncStorage.multiRemove(['storageData', 'workTimeSetting'])
        }}
        color={'red'}
        title='Reset' />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataMapView: {
    borderWidth: 2,
    borderColor: '#fff',
  }
});
