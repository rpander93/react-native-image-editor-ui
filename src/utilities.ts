import { Image, ImageURISource } from "react-native";
import type { PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

interface Vector<T> {
  x: Animated.SharedValue<T>;
  initialX: T;
  y: Animated.SharedValue<T>;
  initialY: T;
}

export function useVector<T = number>({ x: initialX, y: initialY }: { x: T; y: T }): Vector<T> {
  return { x: useSharedValue(initialX), y: useSharedValue(initialY), initialX, initialY };
}

export function useIndicatorStyle({ x, y }: Vector<number>) {
  return useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }), [x, y]);
}

interface GestureEventContext extends Record<string, unknown> {
  startX: number;
  startY: number;
}

export function useIndicatorGestureHandler(
  vector: Vector<number>,
  trackingX: Animated.SharedValue<number>,
  trackingY: Animated.SharedValue<number>,
  [lowerX, upperX]: Array<Animated.SharedValue<number>>,
  [lowerY, upperY]: Array<Animated.SharedValue<number>>,
  isActive: Animated.SharedValue<boolean>
) {
  return useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureEventContext>(
    {
      onStart: (_, context) => {
        context.startX = vector.x.value;
        context.startY = vector.y.value;

        isActive.value = true;
      },
      onActive: (event, context) => {
        const currX = context.startX + event.translationX;
        vector.x.value = Math.min(Math.max(currX, lowerX.value), upperX.value);

        const currY = context.startY + event.translationY;
        vector.y.value = Math.min(Math.max(currY, lowerY.value), upperY.value);

        trackingX.value = vector.x.value;
        trackingY.value = vector.y.value;
      },
      onFinish: () => {
        isActive.value = false;
      },
    },
    [vector, trackingX, trackingY, lowerX, upperX, lowerY, upperY]
  );
}

export interface Bounds {
  topY: number;
  bottomY: number;
  leftX: number;
  rightX: number;
}

export function createBoundsValues(initialBounds: Bounds) {
  return {
    topY: useSharedValue(initialBounds.topY),
    bottomY: useSharedValue(initialBounds.bottomY),
    leftX: useSharedValue(initialBounds.leftX),
    rightX: useSharedValue(initialBounds.rightX),
  };
}

export function fetchImageDimensions(source: ImageURISource): Promise<{ height: number; width: number }> {
  return new Promise((resolve, reject) => {
    if (undefined !== source.height && undefined !== source.width) {
      return resolve({ height: source.height, width: source.width });
    }

    if (undefined === source.uri) {
      return reject(new Error("Source uri is required"));
    }

    Image.getSize(
      source.uri,
      (width, height) => resolve({ width, height }),
      (_error: unknown) => reject(new Error("Could not fetch image size!"))
    );
  });
}
