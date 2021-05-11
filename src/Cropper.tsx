import * as React from "react";
import { ImageURISource, StyleSheet, View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

import { BOX_INDICATOR_BORDER, BOX_INDICATOR_SIZE, BOX_WIDTH } from "./constants";
import { useIndicatorGesture, useIndicatorStyle, useVector } from "./utilities";

interface CropperProps {
  dimensions: { height: number; width: number };
  source: ImageURISource;
}

interface CropperRefMethods {
  reset: () => void;
}

function Cropper({ dimensions, source }: CropperProps, ref: React.Ref<CropperRefMethods>) {
  const [currDimensions, setCurrDimensions] = React.useState(dimensions);

  const aspectRatio = currDimensions.width / currDimensions.height;
  const imageWidth = BOX_WIDTH - 2;
  const imageHeight = imageWidth / aspectRatio;

  const topLeft = useVector({
    x: -BOX_INDICATOR_BORDER,
    y: -BOX_INDICATOR_BORDER,
  });
  const bottomLeft = useVector({
    x: -BOX_INDICATOR_BORDER,
    y: imageHeight - 19 + BOX_INDICATOR_BORDER,
  });
  const topRight = useVector({
    x: BOX_WIDTH - BOX_INDICATOR_SIZE + BOX_INDICATOR_BORDER,
    y: -BOX_INDICATOR_BORDER,
  });
  const bottomRight = useVector({
    x: BOX_WIDTH - BOX_INDICATOR_SIZE + BOX_INDICATOR_BORDER,
    y: imageHeight - 19 + BOX_INDICATOR_BORDER,
  });

  const topLeftStyle = useIndicatorStyle(topLeft);
  const topRightStyle = useIndicatorStyle(topRight);
  const bottomLeftStyle = useIndicatorStyle(bottomLeft);
  const bottomRightStyle = useIndicatorStyle(bottomRight);

  const handleOnReset = () => {
    [topLeft, topRight, bottomLeft, bottomRight].forEach(vector => {
      vector.x.value = withTiming(vector.initialX);
      vector.y.value = withTiming(vector.initialY);
    });
  };

  React.useImperativeHandle(ref, () => ({
    reset: handleOnReset,
  }));

  React.useEffect(() => {
    handleOnReset();
  }, [dimensions]);

  const topLeftGestureHandler = useIndicatorGesture(topLeft, bottomLeft.x, topRight.y, "max", "max");
  const topRightGestureHandler = useIndicatorGesture(topRight, bottomRight.x, topLeft.y, "min", "max");
  const bottomLeftGestureHandler = useIndicatorGesture(bottomLeft, topLeft.x, bottomRight.y, "max", "min");
  const bottomRightGestureHandler = useIndicatorGesture(bottomRight, topRight.x, bottomLeft.y, "min", "min");

  const boundingBoxStyles = useAnimatedStyle(() => {
    return {
      top: topLeft.y.value - topLeft.initialY,
      left: topLeft.x.value - topLeft.initialX,
      bottom: bottomRight.initialY - bottomRight.y.value,
      right: bottomRight.initialX - bottomRight.x.value,
    };
  });

  const imageDimensions = { height: imageHeight, width: imageWidth };

  const backgroundImageStyle = useAnimatedStyle(() => {
    return { opacity: 0.5 };
  });

  const focusedImageStyle = useAnimatedStyle(() => {
    // 3 = to correct for blurred image top, left and bounding box border size
    return { top: -topLeft.y.value - 3, left: -topLeft.x.value - 3 };
  });

  return (
    <View style={{ height: imageHeight + 2, width: imageWidth + 2 }}>
      <Animated.Image blurRadius={8} source={source} style={[styles.image, imageDimensions, backgroundImageStyle]} />
      <Animated.View style={[styles.boundingBox, boundingBoxStyles]}>
        <Animated.Image source={source} style={[styles.image, imageDimensions, focusedImageStyle]} />
      </Animated.View>
      <PanGestureHandler onGestureEvent={topLeftGestureHandler}>
        {/* eslint-disable-next-line prettier/prettier */}
        <Animated.View
          hitSlop={INDICATOR_HIT_SLOP}
          style={[styles.indicator, styles.indicatorTopLeft, topLeftStyle]}
        />
      </PanGestureHandler>
      <PanGestureHandler onGestureEvent={topRightGestureHandler}>
        <Animated.View
          hitSlop={INDICATOR_HIT_SLOP}
          style={[styles.indicator, styles.indicatorTopRight, topRightStyle]}
        />
      </PanGestureHandler>
      <PanGestureHandler onGestureEvent={bottomLeftGestureHandler}>
        <Animated.View
          hitSlop={INDICATOR_HIT_SLOP}
          style={[styles.indicator, styles.indicatorBottomLeft, bottomLeftStyle]}
        />
      </PanGestureHandler>
      <PanGestureHandler onGestureEvent={bottomRightGestureHandler}>
        <Animated.View
          hitSlop={INDICATOR_HIT_SLOP}
          style={[styles.indicator, styles.indicatorBottomRight, bottomRightStyle]}
        />
      </PanGestureHandler>
    </View>
  );
}

const INDICATOR_HIT_SLOP = {
  top: (40 - BOX_INDICATOR_SIZE) / 2,
  bottom: (40 - BOX_INDICATOR_SIZE) / 2,
  left: (40 - BOX_INDICATOR_SIZE) / 2,
  right: (40 - BOX_INDICATOR_SIZE) / 2,
};

const styles = StyleSheet.create({
  boundingBox: {
    borderColor: "white",
    borderWidth: 1,
    position: "absolute",
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    top: 1,
    left: 1,
  },
  indicator: {
    position: "absolute",
    height: BOX_INDICATOR_SIZE,
    width: BOX_INDICATOR_SIZE,
  },
  indicatorTopLeft: {
    borderTopColor: "white",
    borderTopWidth: BOX_INDICATOR_BORDER,
    borderStartColor: "white",
    borderStartWidth: BOX_INDICATOR_BORDER,
  },
  indicatorTopRight: {
    borderTopColor: "white",
    borderTopWidth: BOX_INDICATOR_BORDER,
    borderEndColor: "white",
    borderEndWidth: BOX_INDICATOR_BORDER,
  },
  indicatorBottomLeft: {
    borderBottomColor: "white",
    borderBottomWidth: BOX_INDICATOR_BORDER,
    borderStartColor: "white",
    borderStartWidth: BOX_INDICATOR_BORDER,
  },
  indicatorBottomRight: {
    borderBottomColor: "white",
    borderBottomWidth: BOX_INDICATOR_BORDER,
    borderEndColor: "white",
    borderEndWidth: BOX_INDICATOR_BORDER,
  },
});

export default React.forwardRef(Cropper);
