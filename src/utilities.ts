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
  return useAnimatedStyle(() => {
    return { transform: [{ translateX: x.value }, { translateY: y.value }] };
  }, [x, y]);
}

interface GestureEventContext extends Record<string, unknown> {
  startX: number;
  startY: number;
}

export function useIndicatorGesture(
  vector: Vector<number>,
  trackingX: Animated.SharedValue<number>,
  trackingY: Animated.SharedValue<number>,
  clampX: "min" | "max",
  clampY: "min" | "max"
) {
  return useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureEventContext>(
    {
      onStart: (_, context) => {
        context.startX = vector.x.value;
        context.startY = vector.y.value;
      },
      onActive: (event, context) => {
        vector.x.value =
          clampX === "max"
            ? Math.max(context.startX + event.translationX, vector.initialX)
            : Math.min(context.startX + event.translationX, vector.initialX);
        vector.y.value =
          clampY === "max"
            ? Math.max(context.startY + event.translationY, vector.initialY)
            : Math.min(context.startY + event.translationY, vector.initialY);

        trackingX.value = vector.x.value;
        trackingY.value = vector.y.value;
      },
    },
    [vector, trackingX, trackingY, clampX, clampY]
  );
}
