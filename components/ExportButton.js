import React from 'react';
import { Alert, Button, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing'; // For sharing the file

const ExportButton = ({ data }) => {
  const exportConfirmation = () => {
    Alert.alert('Exporting Data', 'Are you sure you want to export your check in/out? File will be saved as checkinData.json', [
      {
        text: "Cancel",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel"
      },
      { text: "OK", onPress: () => exportData() }
    ], { cancelable: true })
  }

  const exportData = async () => {
    const fileName = 'checkinData.json';
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    const jsonData = JSON.stringify(data);

    try {
      await FileSystem.writeAsStringAsync(fileUri, jsonData, { encoding: FileSystem.EncodingType.UTF8 });

      if (Platform.OS === 'ios' || !(await Sharing.isAvailableAsync())) {
        Alert.prompt('Success Export!', `Data exported successfully! File location: ${fileUri}`, [{ text: "OK"}], undefined, undefined, undefined, { cancelable: true });
      } else {
        // Sharing the file so the user can choose where to save it (Android/IOS)
        await Sharing.shareAsync(fileUri);
      }
    } catch (e) {
      console.error('Failed to export data:', e);
      alert('Failed to export data. Check console for more information.');
    }
  };

  return (
    <Button onPress={exportConfirmation} title='Export Data' />
  );
};

export default ExportButton;
