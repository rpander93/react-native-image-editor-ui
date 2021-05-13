import * as React from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { BOX_BORDER } from "./constants";

interface GridlinesProps {
  topY: Animated.SharedValue<number>;
  bottomY: Animated.SharedValue<number>;
  leftX: Animated.SharedValue<number>;
  rightX: Animated.SharedValue<number>;
  visible: Animated.SharedValue<boolean>;
}

// Need multiple transforms for vertical gridlines or else they
// seem to overlap eachother and only 1 is shown
export default function Gridlines({ topY, bottomY, leftX, rightX, visible }: GridlinesProps) {
  const horizontal1 = useAnimatedStyle(() => ({
    transform: [{ translateY: (bottomY.value - topY.value) * (1 / 3) }],
    opacity: true === visible.value ? 0.5 : 0,
  }));

  const horizontal2 = useAnimatedStyle(() => ({
    transform: [{ translateY: (bottomY.value - topY.value) * (2 / 3) }],
    opacity: true === visible.value ? 0.5 : 0,
  }));

  const vertical1 = useAnimatedStyle(() => ({
    transform: [
      { rotate: "90deg" },
      { translateX: (bottomY.value - topY.value + 2 * BOX_BORDER) / 2 },
      { scaleX: bottomY.value - topY.value / (rightX.value - leftX.value) },
      { translateY: (2 / 3 - 1 / 2) * (rightX.value - leftX.value) },
    ],
    opacity: true === visible.value ? 0.5 : 0,
  }));

  const vertical2 = useAnimatedStyle(() => ({
    transform: [
      { rotate: "90deg" },
      { translateX: (bottomY.value - topY.value + 2 * BOX_BORDER) / 2 },
      { scaleX: bottomY.value - topY.value + 1 / (rightX.value - leftX.value) },
      { translateY: -(2 / 3 - 1 / 2) * (rightX.value - leftX.value) },
    ],
    opacity: true === visible.value ? 0.5 : 0,
  }));

  return (
    <>
      <Animated.View style={[styles.gridline, horizontal1]} />
      <Animated.View style={[styles.gridline, horizontal2]} />
      <Animated.View style={[styles.gridline, vertical1]} />
      <Animated.View style={[styles.gridline, vertical2]} />
    </>
  );
}

const styles = StyleSheet.create({
  gridline: {
    backgroundColor: "white",
    height: 1,
    width: "100%",
  },
});
