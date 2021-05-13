import * as React from "react";
import { ImageURISource, StyleSheet, View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { BOX_BORDER, BOX_INDICATOR_BORDER, BOX_INDICATOR_SIZE } from "./constants";
import Gridlines from "./Gridlines";
import { Bounds, createBoundsValues, useIndicatorGestureHandler, useIndicatorStyle, useVector } from "./utilities";

export type RotationAngles = -270 | -180 | -90 | 90 | 180 | 270;
export type Adjustments = { rotate: number; originX: number; originY: number; width: number; height: number };

interface CropperProps {
  gridlines?: boolean;
  maxWidth: number;
  maxHeight: number;
  source: ImageURISource & { height: number; width: number };
}

interface CropperRefMethods {
  getAdjustments: () => Adjustments;
  reset: () => void;
  rotate: (degrees: RotationAngles) => void;
}

function Cropper({ gridlines = true, maxWidth, maxHeight, source }: CropperProps, ref: React.Ref<CropperRefMethods>) {
  const aspectRatio = source.width / source.height;
  const imageWidth = maxWidth - 2;
  const imageHeight = imageWidth / aspectRatio;

  const initialBounds: Bounds = {
    topY: -BOX_INDICATOR_BORDER,
    bottomY: imageHeight - BOX_INDICATOR_SIZE + BOX_INDICATOR_BORDER,
    leftX: -BOX_INDICATOR_BORDER,
    rightX: maxWidth - BOX_INDICATOR_SIZE + BOX_INDICATOR_BORDER,
  };

  const isCropping = useSharedValue(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const bounds = createBoundsValues(initialBounds);

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

  const resetIndicatorPositions = () => {
    topLeft.x.value = initialBounds.leftX;
    topLeft.y.value = initialBounds.topY;

    bottomLeft.x.value = initialBounds.leftX;
    bottomLeft.y.value = initialBounds.bottomY;

    topRight.x.value = initialBounds.rightX;
    topRight.y.value = initialBounds.topY;

    bottomRight.x.value = initialBounds.rightX;
    bottomRight.y.value = initialBounds.bottomY;
  };

  const resetBounds = () => {
    bounds.topY.value = initialBounds.topY;
    bounds.bottomY.value = initialBounds.bottomY;
    bounds.leftX.value = initialBounds.leftX;
    bounds.rightX.value = initialBounds.rightX;
  };

  const handleOnReset = () => {
    resetIndicatorPositions();
    resetBounds();

    rotation.value = withTiming(0);
    scale.value = withTiming(1);
  };

  const handleOnRotate = (degrees: RotationAngles) => {
    const isOriginalOrientation = degrees % 180 === 0;
    const nextScale = isOriginalOrientation ? 1 : aspectRatio;
    const heightDiff = imageWidth - imageHeight;
    const widthScaleDiff = imageWidth - imageWidth * nextScale;

    rotation.value = withTiming(degrees);
    scale.value = withTiming(nextScale);

    if (isOriginalOrientation) {
      resetBounds();
      resetIndicatorPositions();

      return;
    }

    const topY = initialBounds.topY - (heightDiff - widthScaleDiff) / 2;
    const bottomY = initialBounds.bottomY + (heightDiff - widthScaleDiff) / 2;

    topLeft.y.value = withTiming(topY);
    topRight.y.value = withTiming(topY);
    bottomLeft.y.value = withTiming(bottomY);
    bottomRight.y.value = withTiming(bottomY);

    bounds.topY.value = topY;
    bounds.bottomY.value = bottomY;
  };

  React.useImperativeHandle(ref, () => ({
    getAdjustments: () => ({
      rotate: rotation.value,
      originX: topLeft.x.value - initialBounds.leftX,
      originY: topLeft.y.value - initialBounds.topY,
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
    [bounds.topY, bottomLeft.y],
    isCropping
  );
  const topRightGestureHandler = useIndicatorGestureHandler(
    topRight,
    bottomRight.x,
    topLeft.y,
    [topLeft.x, bounds.rightX],
    [bounds.topY, bottomRight.y],
    isCropping
  );
  const bottomLeftGestureHandler = useIndicatorGestureHandler(
    bottomLeft,
    topLeft.x,
    bottomRight.y,
    [bounds.leftX, bottomRight.x],
    [topLeft.y, bounds.bottomY],
    isCropping
  );
  const bottomRightGestureHandler = useIndicatorGestureHandler(
    bottomRight,
    topRight.x,
    bottomLeft.y,
    [bottomLeft.x, bounds.rightX],
    [topRight.y, bounds.bottomY],
    isCropping
  );

  const imageDimensions = { height: imageHeight, width: imageWidth };

  const backgroundImageStyle = useAnimatedStyle(() => {
    return { opacity: 0.5, transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }] };
  });

  const boundingBoxStyles = useAnimatedStyle(() => {
    return {
      top: topLeft.y.value - initialBounds.topY,
      left: topLeft.x.value - initialBounds.leftX,
      bottom: initialBounds.bottomY - bottomRight.y.value,
      right: initialBounds.rightX - bottomRight.x.value,
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
    <View style={{ height: imageHeight + 2 * BOX_BORDER, width: imageWidth + 2 * BOX_BORDER }}>
      <Animated.Image blurRadius={8} source={source} style={[styles.image, imageDimensions, backgroundImageStyle]} />
      <Animated.View style={[styles.boundingBox, boundingBoxStyles]}>
        <Animated.Image source={source} style={[styles.image, imageDimensions, focusedImageStyle]} />
        {gridlines && (
          <Gridlines
            topY={topLeft.y}
            bottomY={bottomLeft.y}
            leftX={topLeft.x}
            rightX={topRight.x}
            visible={isCropping}
          />
        )}
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
  top: (44 - BOX_INDICATOR_SIZE) / 2,
  bottom: (44 - BOX_INDICATOR_SIZE) / 2,
  left: (44 - BOX_INDICATOR_SIZE) / 2,
  right: (44 - BOX_INDICATOR_SIZE) / 2,
};

const styles = StyleSheet.create({
  boundingBox: {
    borderColor: "white",
    borderWidth: BOX_BORDER,
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
