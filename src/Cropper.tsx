import * as React from "react";
import { ImageURISource, StyleSheet, View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { BOX_INDICATOR_BORDER, BOX_INDICATOR_SIZE, BOX_WIDTH } from "./constants";
import { useIndicatorGesture, useIndicatorStyle, useVector } from "./utilities";

type RotationAngles = -270 | -180 | -90 | 90 | 180 | 270;
type Adjustments = { rotate: number; originX: number; originY: number; width: number; height: number };

interface CropperProps {
  dimensions: { height: number; width: number };
  source: ImageURISource;
}

interface CropperRefMethods {
  getAdjustments: () => Adjustments;
  reset: () => void;
  rotate: (degrees: RotationAngles) => void;
}

function Cropper({ dimensions, source }: CropperProps, ref: React.Ref<CropperRefMethods>) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const aspectRatio = dimensions.width / dimensions.height;
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

  const resetVectors = () => {
    [topLeft, topRight, bottomLeft, bottomRight].forEach(vector => {
      vector.x.value = withTiming(vector.initialX);
      vector.y.value = withTiming(vector.initialY);
    });
  };

  const handleOnReset = () => {
    resetVectors();

    rotation.value = withTiming(0);
    scale.value = withTiming(1);
  };

  const handleOnRotate = (degrees: RotationAngles) => {
    const isOriginalDimensions = degrees % 180 === 0;
    const heightDiff = imageHeight - imageWidth;

    rotation.value = withTiming(degrees);
    scale.value = withTiming(isOriginalDimensions ? 1 : aspectRatio);

    if (isOriginalDimensions) return resetVectors();

    topLeft.y.value = withTiming(topLeft.initialY + heightDiff - BOX_INDICATOR_SIZE + BOX_INDICATOR_BORDER);
    topRight.y.value = withTiming(topRight.initialY + heightDiff - BOX_INDICATOR_SIZE + BOX_INDICATOR_BORDER);
    bottomLeft.y.value = withTiming(bottomLeft.initialY - heightDiff + BOX_INDICATOR_SIZE - BOX_INDICATOR_BORDER * 2);
    bottomRight.y.value = withTiming(bottomRight.initialY - heightDiff + BOX_INDICATOR_SIZE - BOX_INDICATOR_BORDER * 2);
  };

  React.useImperativeHandle(ref, () => ({
    getAdjustments: () => {
      return {
        rotate: rotation.value,
        originX: topLeft.x.value,
        originY: topLeft.y.value,
        width: topRight.x.value - topLeft.x.value,
        height: topLeft.y.value - bottomLeft.y.value,
      };
    },
    reset: handleOnReset,
    rotate: handleOnRotate,
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
    return { opacity: 0.5, transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }] };
  });

  const focusedImageStyle = useAnimatedStyle(() => {
    return {
      top: -topLeft.y.value - BOX_INDICATOR_BORDER,
      left: -topLeft.x.value - BOX_INDICATOR_BORDER,
      transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    };
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
