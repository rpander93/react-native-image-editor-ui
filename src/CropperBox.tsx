import * as React from "react";
import { Image, ImageURISource, StyleSheet, View } from "react-native";
import { PanGestureHandler, PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { CROPPER_BOX_TIP_BORDER, CROPPER_BOX_TIP_SIZE, CROPPER_WIDTH } from "./constants";

interface CropperBoxProps {
  dimensions: { height: number; width: number };
  source: ImageURISource;
}

interface GestureEventContext extends Record<string, unknown> {
  startX: number;
  startY: number;
}

function useVector(x: number, y: number) {
  return [useSharedValue(x), useSharedValue(y)];
}

function useIndicatorStyle(translateX: Animated.SharedValue<number>, translateY: Animated.SharedValue<number>) {
  return useAnimatedStyle(() => {
    return { transform: [{ translateX: translateX.value }, { translateY: translateY.value }] };
  });
}

function CropperBox({ dimensions, source }: CropperBoxProps, ref: React.Ref<{ reset: () => void }>) {
  const aspectRatio = dimensions.width / dimensions.height;
  const imageWidth = CROPPER_WIDTH - 2;
  const imageHeight = imageWidth / aspectRatio;

  const tlXStart = -CROPPER_BOX_TIP_BORDER;
  const tlYStart = -CROPPER_BOX_TIP_BORDER;
  const [tlX, tlY] = useVector(tlXStart, tlYStart);

  const trXStart = CROPPER_WIDTH - CROPPER_BOX_TIP_SIZE + CROPPER_BOX_TIP_BORDER;
  const trYStart = -CROPPER_BOX_TIP_BORDER;
  const [trX, trY] = useVector(trXStart, trYStart);

  const blXStart = -CROPPER_BOX_TIP_BORDER;
  const blYStart = imageHeight - 19 + CROPPER_BOX_TIP_BORDER;
  const [blX, blY] = useVector(blXStart, blYStart);

  const brXStart = CROPPER_WIDTH - CROPPER_BOX_TIP_SIZE + CROPPER_BOX_TIP_BORDER;
  const brYStart = imageHeight - 19 + CROPPER_BOX_TIP_BORDER;
  const [brX, brY] = useVector(brXStart, brYStart);

  const topLeftStyle = useIndicatorStyle(tlX, tlY);
  const topRightStyle = useIndicatorStyle(trX, trY);
  const bottomLeftStyle = useIndicatorStyle(blX, blY);
  const bottomRightStyle = useIndicatorStyle(brX, brY);

  const handleOnReset = () => {
    tlX.value = withTiming(tlXStart);
    tlY.value = withTiming(tlYStart);
    trX.value = withTiming(trXStart);
    trY.value = withTiming(trYStart);
    blX.value = withTiming(blXStart);
    blY.value = withTiming(blYStart);
    brX.value = withTiming(brXStart);
    brY.value = withTiming(brYStart);
  };

  React.useImperativeHandle(ref, () => ({
    reset: handleOnReset,
  }));

  React.useEffect(() => {
    handleOnReset();
  }, [dimensions]);

  const topLeftGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureEventContext>({
    onStart: (_, context) => {
      context.startX = tlX.value;
      context.startY = tlY.value;
    },
    onActive: (event, context) => {
      tlX.value = Math.max(context.startX + event.translationX, tlXStart);
      tlY.value = Math.max(context.startY + event.translationY, tlYStart);

      trY.value = tlY.value;
      blX.value = tlX.value;
    },
  });

  const topRightGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureEventContext>({
    onStart: (_, context) => {
      context.startX = trX.value;
      context.startY = trY.value;
    },
    onActive: (event, context) => {
      trX.value = Math.min(context.startX + event.translationX, trXStart);
      trY.value = Math.max(context.startY + event.translationY, trYStart);

      tlY.value = trY.value;
      brX.value = trX.value;
    },
  });

  const bottomLeftGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureEventContext>({
    onStart: (_, context) => {
      context.startX = blX.value;
      context.startY = blY.value;
    },
    onActive: (event, context) => {
      blX.value = Math.max(context.startX + event.translationX, blXStart);
      blY.value = Math.min(context.startY + event.translationY, blYStart);

      brY.value = blY.value;
      tlX.value = blX.value;
    },
  });

  const bottomRightGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureEventContext>({
    onStart: (_, context) => {
      context.startX = brX.value;
      context.startY = brY.value;
    },
    onActive: (event, context) => {
      brX.value = Math.min(context.startX + event.translationX, brXStart);
      brY.value = Math.min(context.startY + event.translationY, brYStart);

      blY.value = brY.value;
      trX.value = brX.value;
    },
  });

  const boundingBoxStyles = useAnimatedStyle(() => {
    return {
      top: tlY.value + CROPPER_BOX_TIP_BORDER,
      left: tlX.value + CROPPER_BOX_TIP_BORDER,
      bottom: brYStart - brY.value,
      right: brXStart - brX.value,
    };
  });

  const imageDimensions = { height: imageHeight, width: imageWidth };
  const focusedImageStyle = useAnimatedStyle(() => {
    // 3 = to correct for blurred image top, left and bounding box border size
    return { top: -tlY.value - 3, left: -tlX.value - 3 };
  });

  return (
    <View style={{ height: imageHeight + 2, width: imageWidth + 2 }}>
      <Image blurRadius={8} source={source} style={[styles.image, imageDimensions]} />
      <Animated.View style={[styles.boundingBox, boundingBoxStyles]}>
        <Animated.Image source={source} style={[styles.image, imageDimensions, focusedImageStyle]} />
      </Animated.View>
      <PanGestureHandler onGestureEvent={topLeftGestureHandler}>
        <Animated.View style={[styles.indicator, styles.indicatorTopLeft, topLeftStyle]} />
      </PanGestureHandler>
      <PanGestureHandler onGestureEvent={topRightGestureHandler}>
        <Animated.View style={[styles.indicator, styles.indicatorTopRight, topRightStyle]} />
      </PanGestureHandler>
      <PanGestureHandler onGestureEvent={bottomLeftGestureHandler}>
        <Animated.View style={[styles.indicator, styles.indicatorBottomLeft, bottomLeftStyle]} />
      </PanGestureHandler>
      <PanGestureHandler onGestureEvent={bottomRightGestureHandler}>
        <Animated.View style={[styles.indicator, styles.indicatorBottomRight, bottomRightStyle]} />
      </PanGestureHandler>
    </View>
  );
}

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
    height: CROPPER_BOX_TIP_SIZE,
    width: CROPPER_BOX_TIP_SIZE,
  },
  indicatorTopLeft: {
    borderTopColor: "white",
    borderTopWidth: CROPPER_BOX_TIP_BORDER,
    borderStartColor: "white",
    borderStartWidth: CROPPER_BOX_TIP_BORDER,
  },
  indicatorTopRight: {
    borderTopColor: "white",
    borderTopWidth: CROPPER_BOX_TIP_BORDER,
    borderEndColor: "white",
    borderEndWidth: CROPPER_BOX_TIP_BORDER,
  },
  indicatorBottomLeft: {
    borderBottomColor: "white",
    borderBottomWidth: CROPPER_BOX_TIP_BORDER,
    borderStartColor: "white",
    borderStartWidth: CROPPER_BOX_TIP_BORDER,
  },
  indicatorBottomRight: {
    borderBottomColor: "white",
    borderBottomWidth: CROPPER_BOX_TIP_BORDER,
    borderEndColor: "white",
    borderEndWidth: CROPPER_BOX_TIP_BORDER,
  },
});

export default React.forwardRef(CropperBox);
