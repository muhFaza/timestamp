import { Button, FlatList, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { MaterialIcons } from '@expo/vector-icons';
import Spacer from "./Spacer";
import React, { useCallback, useMemo } from "react";

const Lists = React.memo(({ storage, onDelete }) => {
  const isDarkMode = useColorScheme() === 'dark'
  const textColor = useMemo(() => ({
    color: isDarkMode ? Colors.lighter : Colors.darker,
  }), [isDarkMode])

  const formatDuration = useCallback((milliseconds) => {
    let totalSeconds = Math.abs(milliseconds) / 1000; // Convert to seconds and ensure positive
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [])


  const renderItem = ({ item, index }) => (
    <Spacer vertical={0}>
      <View style={styles.dataMapView}>
        <View>
          <Spacer vertical={0}>
            <Text style={textColor}>Checkin:   {item.formattedDateIn}</Text>
            <Text style={textColor}>Checkout: {item.formattedDateOut}</Text>
            <Text style={textColor}>Total: {formatDuration(item.totalDuration)}</Text>
          </Spacer>
        </View>
        <View style={styles.deleteIcon}>
          <TouchableOpacity onPress={() => onDelete(index)} >
            <MaterialIcons name="delete-outline" size={24} color="#ddd" />
          </TouchableOpacity>
        </View>
      </View>
    </Spacer>
  );

  return (
    <View style={{ height: 350, width: 350 }}>
      <FlatList
        data={storage}
        renderItem={renderItem}
        keyExtractor={item => item.checkIn.toString()}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  dataMapView: {
    borderWidth: 2,
    borderColor: '#575757', // Lighter than pure white for subtlety
    borderRadius: 7,
    backgroundColor: '#2e2e2e', // Dark shade for item background
    padding: 10, // Padding inside each item for content spacing
    marginBottom: 8, // Margin between items
    flex: 1,
    width: '100%',
    flexDirection: 'row'
  },
  deleteIcon: {
    alignItems: 'flex-end',
    // backgroundColor: 'pink',
    flex: 1
  }
});

export default Lists