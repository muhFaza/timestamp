import { Button, PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs'; // react-native-fs for file system access


const ExportButton = ({ data }) => {
  const exportData = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: "Storage Permission",
          message: "App needs access to your storage to download files",
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        alert('Storage permission denied');
        return;
      }
    }

    const path = `${RNFS.DownloadDirectoryPath}/checkinData.json`;
    const jsonData = JSON.stringify(data);

    try {
      await RNFS.writeFile(path, jsonData, 'utf8');
      alert(`Data exported successfully! File location: ${path}`);
    } catch (e) {
      console.error('Failed to export data:', e);
      alert('Failed to export data. Check console for more information.');
    }
  };

  return (
    <Button onPress={exportData}>Export Data</Button>
  )
}

export default ExportButton;