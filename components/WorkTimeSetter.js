import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const TimeSetter = ({ onSave }) => {
  const [hours, setHours] = useState('9');
  const [minutes, setMinutes] = useState('0');
  const [seconds, setSeconds] = useState('0');

  // Helper function to generate array of numbers for the Picker
  const generatePickerNumbers = useCallback((max) => {
    return Array.from({ length: max }, (_, i) => i.toString());
  }, [])

  const handleSave = useCallback(() => {
    const totalMs = (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)) * 1000;
    onSave(totalMs);
  }, [hours, minutes, seconds])

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={hours}
        style={styles.picker}
        dropdownIconColor={'white'}
        mode='dropdown'
        onValueChange={(itemValue) => setHours(itemValue)}>
        {generatePickerNumbers(100).map((value) => (
          <Picker.Item key={value} label={value} value={value} />
        ))}
      </Picker>
      <Picker
        selectedValue={minutes}
        style={styles.picker}
        dropdownIconColor={'white'}
        mode='dropdown'
        onValueChange={(itemValue) => setMinutes(itemValue)}>
        {generatePickerNumbers(60).map((value) => (
          <Picker.Item key={value} label={value} value={value} />
        ))}
      </Picker>
      <Picker
        selectedValue={seconds}
        style={styles.picker}
        dropdownIconColor={'white'}
        mode='dropdown'
        themeVariant={'dark'}
        onValueChange={(itemValue) => setSeconds(itemValue)}>
        {generatePickerNumbers(60).map((value) => (
          <Picker.Item key={value} label={value} value={value} />
        ))}
      </Picker>
      <Button title="Save" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    width: 90,
    height: 80,
    color: 'white',
  },
});

export default React.memo(TimeSetter);
