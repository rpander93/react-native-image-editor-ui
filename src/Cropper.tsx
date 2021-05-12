import * as React from "react";
import { ImageURISource, StyleSheet, View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { BOX_INDICATOR_BORDER, BOX_INDICATOR_SIZE, BOX_WIDTH } from "./constants";
import { useIndicatorGestureHandler, useIndicatorStyle, useVector } from "./utilities";

export type RotationAngles = -270 | -180 | -90 | 90 | 180 | 270;
export type Adjustments = { rotate: number; originX: number; originY: number; width: number; height: number };

interface CropperProps {
  source: ImageURISource & { height: number; width: number };
}

interface CropperRefMethods {
  getAdjustments: () => Adjustments;
  reset: () => void;
  rotate: (degrees: RotationAngles) => void;
}

function Cropper({ source }: CropperProps, ref: React.Ref<CropperRefMethods>) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const aspectRatio = source.width / source.height;
  const imageWidth = BOX_WIDTH - 2;
  const imageHeight = imageWidth / aspectRatio;

  const initialBounds = {
    topY: -BOX_INDICATOR_BORDER,
    bottomY: imageHeight - 19 + BOX_INDICATOR_BORDER,
    leftX: -BOX_INDICATOR_BORDER,
    rightX: BOX_WIDTH - BOX_INDICATOR_SIZE + BOX_INDICATOR_BORDER,
  };

  const [bounds, setBounds] = React.useState(initialBounds);

  const topLeft = useVector({
    x: initialBounds.leftX,
    y: initialBounds.topY,
  });
  const bottomLeft = useVector({
    x: initialBounds.leftX,
    y: initialBounds.bottomY,
  });
  const topRight = useVector({
    x: initialBounds.rightX,
    y: initialBounds.topY,
  });
  const bottomRight = useVector({
    x: initialBounds.rightX,
    y: initialBounds.bottomY,
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

  const resetBounds = () => {
    setBounds(initialBounds);
  };

  const handleOnReset = () => {
    resetVectors();
    resetBounds();

    rotation.value = withTiming(0);
    scale.value = withTiming(1);
  };

  const handleOnRotate = (degrees: RotationAngles) => {
    const isOriginalDimensions = degrees % 180 === 0;
    const heightDiff = imageHeight - imageWidth;

    rotation.value = withTiming(degrees);
    scale.value = withTiming(isOriginalDimensions ? 1 : aspectRatio);

    if (isOriginalDimensions) {
      resetBounds();
      resetVectors();

      return;
    }

    const topY = topLeft.initialY + heightDiff - BOX_INDICATOR_SIZE + BOX_INDICATOR_BORDER;
    const bottomY = bottomLeft.initialY - heightDiff + BOX_INDICATOR_SIZE - BOX_INDICATOR_BORDER * 2;

    // Adjust box positions
    topLeft.y.value = withTiming(topY);
    topRight.y.value = withTiming(topY);
    bottomLeft.y.value = withTiming(bottomY);
    bottomRight.y.value = withTiming(bottomY);

    // Update bounds
    setBounds(current => ({
      ...current,
      topY,
      bottomY,
    }));
  };

  React.useImperativeHandle(ref, () => ({
    getAdjustments: () => ({
      rotate: rotation.value,
      originX: topLeft.x.value - topLeft.initialX,
      originY: topLeft.y.value - topLeft.initialY,
      width: topRight.x.value - topLeft.x.value,
      height: bottomLeft.y.value - topLeft.y.value,
    }),
    reset: handleOnReset,
    rotate: handleOnRotate,
  }));

  React.useEffect(() => {
    handleOnReset();
  }, [source]);

  const topLeftGestureHandler = useIndicatorGestureHandler(
    topLeft,
    bottomLeft.x,
    topRight.y,
    [bounds.leftX, topRight.x],
    [bounds.topY, bottomLeft.y]
  );
  const topRightGestureHandler = useIndicatorGestureHandler(
    topRight,
    bottomRight.x,
    topLeft.y,
    [topLeft.x, bounds.rightX],
    [bounds.topY, bottomRight.y]
  );
  const bottomLeftGestureHandler = useIndicatorGestureHandler(
    bottomLeft,
    topLeft.x,
    bottomRight.y,
    [bounds.leftX, bottomRight.x],
    [topLeft.y, bounds.bottomY]
  );
  const bottomRightGestureHandler = useIndicatorGestureHandler(
    bottomRight,
    topRight.x,
    bottomLeft.y,
    [bottomLeft.x, bounds.rightX],
    [topRight.y, bounds.bottomY]
  );

  const imageDimensions = { height: imageHeight, width: imageWidth };

  const backgroundImageStyle = useAnimatedStyle(() => {
    return { opacity: 0.5, transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }] };
  });

  const boundingBoxStyles = useAnimatedStyle(() => {
    return {
      top: topLeft.y.value - topLeft.initialY,
      left: topLeft.x.value - topLeft.initialX,
      bottom: bottomRight.initialY - bottomRight.y.value,
      right: bottomRight.initialX - bottomRight.x.value,
    };
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