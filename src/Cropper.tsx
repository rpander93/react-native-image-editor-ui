import * as React from "react";
import { ImageURISource, StyleSheet, View } from "react-native";
import { PanGestureHandler, PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { BOX_BORDER, BOX_INDICATOR_BORDER, BOX_INDICATOR_SIZE } from "./constants";
import Gridlines from "./Gridlines";
import { Bounds, createBoundsValues } from "./utilities";

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

interface GestureEventContext extends Record<string, unknown> {
  topY: number;
  bottomY: number;
  leftX: number;
  rightX: number;
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

  const currentBounds = createBoundsValues(initialBounds);
  const boundingBoxRect = createBoundsValues(initialBounds);

  const resetBoundingBox = () => {
    boundingBoxRect.topY.value = withTiming(initialBounds.topY);
    boundingBoxRect.bottomY.value = withTiming(initialBounds.bottomY);
    boundingBoxRect.leftX.value = withTiming(initialBounds.leftX);
    boundingBoxRect.rightX.value = withTiming(initialBounds.rightX);
  };

  const resetCurrentBounds = () => {
    currentBounds.topY.value = initialBounds.topY;
    currentBounds.bottomY.value = initialBounds.bottomY;
    currentBounds.leftX.value = initialBounds.leftX;
    currentBounds.rightX.value = initialBounds.rightX;
  };

  const handleOnReset = () => {
    resetCurrentBounds();
    resetBoundingBox();

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
      resetBoundingBox();
      resetCurrentBounds();

      return;
    }

    const topY = initialBounds.topY - (heightDiff - widthScaleDiff) / 2;
    const bottomY = initialBounds.bottomY + (heightDiff - widthScaleDiff) / 2;

    // @todo: check if height wont exceed maxHeight

    boundingBoxRect.topY.value = withTiming(topY);
    boundingBoxRect.bottomY.value = withTiming(bottomY);
    currentBounds.topY.value = topY;
    currentBounds.bottomY.value = bottomY;
  };

  React.useImperativeHandle(ref, () => ({
    calculateAdjustments: () => {
      // correct for indicator boxes and borders
      const indicatorSpace = BOX_INDICATOR_SIZE - 2 * BOX_INDICATOR_BORDER;
      const viewBoxWidth = boundingBoxRect.rightX.value - boundingBoxRect.leftX.value + indicatorSpace;
      const viewBoxHeight = boundingBoxRect.bottomY.value - boundingBoxRect.topY.value + indicatorSpace;
      const actualBoxWidth = viewBoxWidth * (source.width / imageWidth);
      const actualBoxHeight = viewBoxHeight * (source.height / imageHeight);

      const viewOriginX = boundingBoxRect.leftX.value - currentBounds.leftX.value;
      const viewOriginY = boundingBoxRect.topY.value - currentBounds.topY.value;
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

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureEventContext>({
    onStart: (_, context) => {
      isActive.value = true;

      context.topY = boundingBoxRect.topY.value;
      context.bottomY = boundingBoxRect.bottomY.value;
      context.leftX = boundingBoxRect.leftX.value;
      context.rightX = boundingBoxRect.rightX.value;
    },
    onActive: (event, context) => {
      const boxWidth = boundingBoxRect.rightX.value - boundingBoxRect.leftX.value;
      const boxHeight = boundingBoxRect.bottomY.value - boundingBoxRect.topY.value;

      // Update vertical axis
      if (event.y < 0.5 * boxHeight) {
        boundingBoxRect.topY.value = Math.max(currentBounds.topY.value, context.topY + event.translationY);
      } else if (event.y > 0.5 * boxHeight) {
        boundingBoxRect.bottomY.value = Math.min(currentBounds.bottomY.value, context.bottomY + event.translationY);
      }

      // Update horizontal axis
      if (event.x < 0.5 * boxWidth) {
        boundingBoxRect.leftX.value = Math.max(currentBounds.leftX.value, context.leftX + event.translationX);
      } else if (event.x > 0.5 * boxWidth) {
        boundingBoxRect.rightX.value = Math.min(currentBounds.rightX.value, context.rightX + event.translationX);
      }
    },
    onFinish: () => {
      isActive.value = false;
    },
  });

  const backgroundImageStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const foregroundImageStyle = useAnimatedStyle(() => ({
    top: -boundingBoxRect.topY.value + initialBounds.topY,
    left: -boundingBoxRect.leftX.value + initialBounds.leftX,
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const boundingBoxStyles = useAnimatedStyle(() => ({
    top: boundingBoxRect.topY.value - initialBounds.topY,
    left: boundingBoxRect.leftX.value - initialBounds.leftX,
    bottom: initialBounds.bottomY - boundingBoxRect.bottomY.value,
    right: initialBounds.rightX - boundingBoxRect.rightX.value,
  }));

  const foregroundImageBoxStyles = useAnimatedStyle(() => ({
    top: boundingBoxRect.topY.value - initialBounds.topY,
    left: boundingBoxRect.leftX.value - initialBounds.leftX,
    bottom: initialBounds.bottomY - boundingBoxRect.bottomY.value,
    right: initialBounds.rightX - boundingBoxRect.rightX.value,
  }));

  const imageDimensions = { height: imageHeight, width: imageWidth };

  return (
    <View style={{ height: imageHeight + 2 * BOX_BORDER, width: imageWidth + 2 * BOX_BORDER }}>
      <Animated.Image
        source={source}
        style={[styles.image, styles.backgroundImage, imageDimensions, backgroundImageStyle]}
      />
      <Animated.View style={[styles.imageBoundingBox, foregroundImageBoxStyles]}>
        <Animated.Image source={source} style={[styles.image, imageDimensions, foregroundImageStyle]} />
        {gridlines && (
          <Gridlines
            topY={boundingBoxRect.topY}
            bottomY={boundingBoxRect.bottomY}
            leftX={boundingBoxRect.leftX}
            rightX={boundingBoxRect.rightX}
            isActive={isActive}
          />
        )}
      </Animated.View>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.boundingBox, boundingBoxStyles]}>
          <Animated.View style={[styles.indicator, styles.indicatorTopLeft]} />
          <Animated.View style={[styles.indicator, styles.indicatorTopRight]} />
          <Animated.View style={[styles.indicator, styles.indicatorBottomLeft]} />
          <Animated.View style={[styles.indicator, styles.indicatorBottomRight]} />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  boundingBox: {
    borderColor: "white",
    borderWidth: BOX_BORDER,
    position: "absolute",
  },
  imageBoundingBox: {
    borderColor: "transparent",
    borderWidth: BOX_BORDER,
    position: "absolute",
    overflow: "hidden",
  },
  backgroundImage: {
    opacity: 0.25,
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
    top: -BOX_INDICATOR_BORDER,
    left: -BOX_INDICATOR_BORDER,
  },
  indicatorTopRight: {
    borderTopColor: "white",
    borderTopWidth: BOX_INDICATOR_BORDER,
    borderEndColor: "white",
    borderEndWidth: BOX_INDICATOR_BORDER,
    top: -BOX_INDICATOR_BORDER,
    right: -BOX_INDICATOR_BORDER,
  },
  indicatorBottomLeft: {
    borderBottomColor: "white",
    borderBottomWidth: BOX_INDICATOR_BORDER,
    borderStartColor: "white",
    borderStartWidth: BOX_INDICATOR_BORDER,
    bottom: -BOX_INDICATOR_BORDER,
    left: -BOX_INDICATOR_BORDER,
  },
  indicatorBottomRight: {
    borderBottomColor: "white",
    borderBottomWidth: BOX_INDICATOR_BORDER,
    borderEndColor: "white",
    borderEndWidth: BOX_INDICATOR_BORDER,
    bottom: -BOX_INDICATOR_BORDER,
    right: -BOX_INDICATOR_BORDER,
  },
});

export default React.forwardRef(Cropper);
