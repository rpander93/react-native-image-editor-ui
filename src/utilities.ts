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

function mapToPlainNumbers(input: Array<number | Animated.SharedValue<number>>) {
  "worklet";

  return input.map(v => (typeof v === "number" ? v : v.value));
}

export function useIndicatorGestureHandler(
  vector: Vector<number>,
  trackingX: Animated.SharedValue<number>,
  trackingY: Animated.SharedValue<number>,
  interpolateX: Array<number | Animated.SharedValue<number>>,
  interpolateY: Array<number | Animated.SharedValue<number>>,
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
        const boundsX = mapToPlainNumbers(interpolateX);
        const currX = context.startX + event.translationX;
        vector.x.value = Math.min(Math.max(currX, boundsX[0]), boundsX[1]);

        const boundsY = mapToPlainNumbers(interpolateY);
        const currY = context.startY + event.translationY;
        vector.y.value = Math.min(Math.max(currY, boundsY[0]), boundsY[1]);

        trackingX.value = vector.x.value;
        trackingY.value = vector.y.value;
      },
      onFinish: () => {
        isActive.value = false;
      },
    },
    [vector, trackingX, trackingY, interpolateX, interpolateY]
  );
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
