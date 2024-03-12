import React from 'react';
import { Button, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const ImportButton = ({ onImportAlert }) => {

  const isValidData = (data) => {
    if (!Array.isArray(data)) return false; // Ensure data is an array

    return data.every(item => {
      // Check for necessary keys and their types
      return typeof item.id === 'number' &&
        typeof item.checkIn === 'number' &&
        (typeof item.checkOut === 'number' || typeof item.checkOut === 'boolean') &&
        typeof item.formattedDateIn === 'string' &&
        (typeof item.formattedDateOut === 'string' || typeof item.formattedDateOut === 'boolean') &&
        (typeof item.totalDuration === 'number' || typeof item.totalDuration === 'boolean');
    });
  };

  const importData = async () => {
    try {
      // Let the user pick a file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json', // Optional: specify MIME type to filter files
      });

      if (result.assets !== null && result.canceled === false) {
        // Read the file content
        const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const data = JSON.parse(fileContent);

        // Validate the imported data
        if (!isValidData(data)) {
          Alert.alert('Error', 'The imported file format is incorrect or corrupted.');
          return;
        }

        if (onImportAlert) {
          onImportAlert(data)
        }
      } else {
        // Handle the case where the user cancels the document picker
        console.log('File selection was cancelled.');
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      Alert.alert('Error', 'Failed to import data. Please try again.');
    }
  };

  return <Button title="Import Data" onPress={importData} />;
};

export default ImportButton;
