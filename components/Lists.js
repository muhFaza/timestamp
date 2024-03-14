import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { MaterialIcons, Feather } from '@expo/vector-icons';
import Spacer from "./Spacer";
import React, { useCallback, useMemo } from "react";

const Lists = React.memo(({ storage, onDelete, setEditFeature }) => {
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

  const getDateTimeFormat = (checkinout) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const date = new Date(checkinout);
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    return `${dayName}, ${day} ${month} ${year}. ${time}`;
  }

  const onEditPrompt = (data, index) => {
    const alertText = `Which one do you want to edit?\n\n` +
      `Check in:\n${getDateTimeFormat(data.checkIn)}` +
      (data.checkOut ? `\n\nCheck out:\n${getDateTimeFormat(data.checkOut)}` : '');

    const buttons = ['checkIn', 'checkOut']
      .filter(field => data[field]) // Only include buttons for existing fields
      .map(field => ({
        text: `Check ${field.slice(5)}`,
        onPress: () => setEditFeature({
          datePickerVisible: true,
          selectedDate: new Date(data[field]),
          editIndex: index,
          editString: field,
        }),
      }));

    Alert.alert('Edit', alertText, [{ text: 'Cancel', style: 'cancel' }, ...buttons], { cancelable: true });
  }


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
          <TouchableOpacity onPress={() => onEditPrompt(item, index)} style={{ marginRight: 1 }} >
            <Feather name="edit" size={19} color="#ddd" />
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
    marginBottom: 4,
    flex: 1,
    justifyContent: 'space-between'
  }
});

export default Lists