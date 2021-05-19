import * as React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageURISource,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Cropper, { Adjustments, RotationAngles } from "./Cropper";
import { fetchImageDimensions } from "./utilities";

interface CropScreenProps {
  onDone?: (adjustments: Adjustments) => void;
  source: ImageURISource;
  useBackgroundCover?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");
const PADDING_HORIZONTAL = 15;
const BOX_WIDTH = SCREEN_WIDTH - PADDING_HORIZONTAL * 2;

export default function CropScreen({ onDone, source, useBackgroundCover = true }: CropScreenProps) {
  const cropperRef = React.useRef<React.ElementRef<typeof Cropper>>(null);
  const rotation = React.useRef<number>(0);

  const [hasDimensions, setHasDimensions] = React.useState(false);
  const [dimensions, setDimensions] = React.useState({ height: 0, width: 0 });

  React.useEffect(() => {
    fetchImageDimensions(source)
      .then(result => {
        setDimensions(result);
        setHasDimensions(true);
      })
      .catch(() => {
        setDimensions({ height: 0, width: 0 });
        setHasDimensions(false);
      });
  }, [source]);

  const handleOnDone = () => {
    if (!cropperRef.current) return;

    onDone?.(cropperRef.current.calculateAdjustments());
  };

  const handleOnReset = () => {
    cropperRef.current?.reset();
    rotation.current = 0;
  };

  const handleOnRotate = () => {
    const newValue = (rotation.current + 90) % 360;

    cropperRef.current?.rotate(newValue as RotationAngles);
    rotation.current = newValue;
  };

  return (
    <View style={styles.page}>
      {useBackgroundCover && (
        <Image blurRadius={28} resizeMode="cover" source={source} style={styles.backgroundCover} />
      )}
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.safeArea}>
          <View style={styles.content}>
            {false === hasDimensions ? (
              <ActivityIndicator color="white" />
            ) : (
              <Cropper
                ref={cropperRef}
                maxHeight={SCREEN_HEIGHT * 0.7}
                maxWidth={BOX_WIDTH}
                source={{ ...source, ...dimensions }}
              />
            )}
          </View>
          <View style={styles.primaryButtons}>
            <Pressable onPress={handleOnRotate}>
              <Text style={styles.resetText}>Rotate</Text>
            </Pressable>
            <Pressable onPress={handleOnReset}>
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          </View>
          <View style={styles.bottomButtons}>
            <Text style={styles.bottomButtonText}>Cancel</Text>
            <Pressable onPress={handleOnDone}>
              <Text style={styles.bottomButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundCover: {
    ...StyleSheet.absoluteFillObject,
    bottom: 50,
    width: SCREEN_WIDTH,
    height: "95%",
    opacity: 0.1,
  },
  bottomButtons: {
    backgroundColor: "rgb(56, 56, 56)",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingVertical: 10,
  },
  bottomButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  container: {
    flex: 1,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  primaryButtons: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingBottom: 10,
  },
  resetText: {
    color: "white",
    fontSize: 16,
  },
  page: {
    backgroundColor: "rgb(56, 56, 56)",
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
