import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, SafeAreaView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Spacer, Lists, Clock, WorkTimeSetter } from './components';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [storageData, setStorageData] = useState([])
  const [viewSavedTime, setViewSavedTime] = useState('')
  const [totalDuration, setTotalDuration] = useState('')
  const [isCheckIn, setIsCheckIn] = useState(true)

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
        const dataFromStorageJSON = await AsyncStorage.getItem('storageData');
        if (dataFromStorageJSON !== null) {
          const dataFromStorage = JSON.parse(dataFromStorageJSON);
          setStorageData(dataFromStorage);

          const lastCheckIn = dataFromStorage[dataFromStorage.length - 1];
          if (lastCheckIn) {
            // Determine check-in status and set the view time based on the last check-in
            setIsCheckIn(lastCheckIn.checkOut ? true : false);
            setViewSavedTime(lastCheckIn.formattedDateOut || lastCheckIn.formattedDateIn);
          }

          setTotalDuration(calculateAllTotalDuration(dataFromStorage))
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadCheckIns();
  }, []);

  const calculateAllTotalDuration = useCallback((dataFromStorage) => {
    const allTotalDuration = dataFromStorage.reduce((acc, currentItem) => {
      if (typeof currentItem.totalDuration === 'number') {
        return acc + currentItem.totalDuration;
      }
      return acc;
    }, 0);

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
    if (isCheckIn) {
      const newId = storageData.length;
      const newData = { id: newId, checkIn: date.getTime(), checkOut: false, formattedDateIn: formattedDate, formattedDateOut: false, totalDuration: false };
      updatedData = [newData, ...storageData];
    } else {
      updatedData = storageData.map((data, index) =>
        index === 0 ? { ...data, checkOut: date.getTime(), formattedDateOut: formattedDate, totalDuration: data.checkIn - date.getTime() } : data
      );
      setTotalDuration(calculateAllTotalDuration(updatedData))
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
      </View>
      <Spacer />
      <Lists storage={storageData} />
      <Spacer />

      <Text style={[textColor]}>Set Work Time:</Text>
      <WorkTimeSetter />
      <Button
        onPress={() => {
          saveDataToStorage([])
          setStorageData([])
          setIsCheckIn(true)
          setViewSavedTime('')
          setTotalDuration('')
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
