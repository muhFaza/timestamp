import { useColorScheme } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";

let darkmode = false

const bgMode = (cb) => {
  darkmode = cb() === 'dark';
}
bgMode()

const backgroundStyle = {
  backgroundColor: darkmode ? Colors.darker : Colors.lighter,
};
const textColor = {
  color: darkmode ? Colors.lighter : Colors.darker,
}

export {
  backgroundStyle,
  textColor,
  bgMode,
}