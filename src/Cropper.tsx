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
  calculateAdjustments: () => Adjustments;
  reset: () => void;
  rotate: (degrees: RotationAngles) => void;
}

function Cropper({ gridlines = true, maxWidth, maxHeight, source }: CropperProps, ref: React.Ref<CropperRefMethods>) {
  const aspectRatio = source.width / source.height;

  let imageWidth = Math.min(maxWidth, source.width) - 2 * BOX_BORDER;
  let imageHeight = imageWidth / aspectRatio;

  if (imageHeight + 2 * BOX_BORDER > maxHeight) {
    imageHeight = maxHeight - 2 * BOX_BORDER;
    imageWidth = imageHeight * aspectRatio;
  }

  const initialBounds: Bounds = {
    topY: -BOX_INDICATOR_BORDER + BOX_BORDER,
    bottomY: imageHeight - BOX_INDICATOR_SIZE + BOX_INDICATOR_BORDER + BOX_BORDER,
    leftX: -BOX_INDICATOR_BORDER + BOX_BORDER,
    rightX: imageWidth - BOX_INDICATOR_SIZE + BOX_INDICATOR_BORDER + BOX_BORDER,
  };

  const isActive = useSharedValue(false);
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
    topLeft.x.value = withTiming(initialBounds.leftX);
    topLeft.y.value = withTiming(initialBounds.topY);

    bottomLeft.x.value = withTiming(initialBounds.leftX);
    bottomLeft.y.value = withTiming(initialBounds.bottomY);

    topRight.x.value = withTiming(initialBounds.rightX);
    topRight.y.value = withTiming(initialBounds.topY);

    bottomRight.x.value = withTiming(initialBounds.rightX);
    bottomRight.y.value = withTiming(initialBounds.bottomY);
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
    calculateAdjustments: () => {
      // correct for indicator boxes and borders
      const indicatorSpace = BOX_INDICATOR_SIZE - 2 * BOX_INDICATOR_BORDER;
      const viewBoxWidth = topRight.x.value - topLeft.x.value + indicatorSpace;
      const viewBoxHeight = bottomLeft.y.value - topLeft.y.value + indicatorSpace;
      const actualBoxWidth = viewBoxWidth * (source.width / imageWidth);
      const actualBoxHeight = viewBoxHeight * (source.height / imageHeight);

      const viewOriginX = topLeft.x.value - bounds.leftX.value;
      const viewOriginY = topLeft.y.value - bounds.topY.value;
      const actualOriginX = (viewOriginX / viewBoxWidth) * actualBoxWidth;
      const actualOriginY = (viewOriginY / viewBoxHeight) * actualBoxHeight;

      return {
        rotate: rotation.value,
        originX: actualOriginX,
        originY: actualOriginY,
        width: actualBoxWidth,
        height: actualBoxHeight,
      };
    },
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
    isActive
  );
  const topRightGestureHandler = useIndicatorGestureHandler(
    topRight,
    bottomRight.x,
    topLeft.y,
    [topLeft.x, bounds.rightX],
    [bounds.topY, bottomRight.y],
    isActive
  );
  const bottomLeftGestureHandler = useIndicatorGestureHandler(
    bottomLeft,
    topLeft.x,
    bottomRight.y,
    [bounds.leftX, bottomRight.x],
    [topLeft.y, bounds.bottomY],
    isActive
  );
  const bottomRightGestureHandler = useIndicatorGestureHandler(
    bottomRight,
    topRight.x,
    bottomLeft.y,
    [bottomLeft.x, bounds.rightX],
    [topRight.y, bounds.bottomY],
    isActive
  );

  const imageDimensions = { height: imageHeight, width: imageWidth };

  const backgroundImageStyle = useAnimatedStyle(() => ({
    opacity: 0.25,
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const boundingBoxStyles = useAnimatedStyle(() => ({
    top: topLeft.y.value - initialBounds.topY,
    left: topLeft.x.value - initialBounds.leftX,
    bottom: initialBounds.bottomY - bottomRight.y.value,
    right: initialBounds.rightX - bottomRight.x.value,
  }));

  const focusedImageStyle = useAnimatedStyle(() => ({
    top: -topLeft.y.value + initialBounds.topY,
    left: -topLeft.x.value + initialBounds.leftX,
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <View style={{ height: imageHeight + 2 * BOX_BORDER, width: imageWidth + 2 * BOX_BORDER }}>
      <Animated.Image source={source} style={[styles.image, imageDimensions, backgroundImageStyle]} />
      <Animated.View style={[styles.boundingBox, boundingBoxStyles]}>
        <Animated.Image source={source} style={[styles.image, imageDimensions, focusedImageStyle]} />
        {gridlines && (
          <Gridlines topY={topLeft.y} bottomY={bottomLeft.y} leftX={topLeft.x} rightX={topRight.x} visible={isActive} />
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
    top: BOX_BORDER,
    left: BOX_BORDER,
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
