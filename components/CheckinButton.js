import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const CheckinButton = ({ onPress, isCheckIn }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, {backgroundColor: isCheckIn ? '#a33cbd' : '#c4352a'}]}>
      <View style={styles.gradient}>
        <Text style={styles.text}>{isCheckIn ? 'Check In' : 'Check Out'}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 5,
    elevation: 5, // for Android
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    alignItems: 'center',
    borderRadius: 25,
  },
  text: {
    color: '#FFF', // Keeping the text white for contrast
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckinButton;