import { Image, ImageURISource } from "react-native";
import { useSharedValue } from "react-native-reanimated";
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
