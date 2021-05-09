import { Image, ImageURISource } from "react-native";

export default function fetchImageDimensions(source: ImageURISource): Promise<{ height: number; width: number }> {
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
