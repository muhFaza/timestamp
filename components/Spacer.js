import { Children } from "react";
import { View } from "react-native"

const Spacer = ({ horizontal = 20, vertical = 20, up, right, down, left, children }) => {
  let x1, x2, y1, y2;
  if (horizontal) {
    x1 = horizontal/2
    x2 = x1
  } else if (right || left) {
    x1 = right
    x2 = left
  }
  if (vertical) {
    y1 = vertical/2
    y2 = y1
  } else if (up || down) {
    y1 = up
    y2 = down
  }

  return (
    <View children={children ? children : null} style={{
      marginTop: y1,
      marginRight: x1,
      marginBottom: y2,
      marginLeft: x2,
    }} />
  )
}

export default Spacer