import * as React from "react";
import { Alert } from "react-native";
import ImageCropper from "react-native-image-cropper";

export default function App() {
  return (
    <ImageCropper
      onDone={adjustments => {
        Alert.alert("Adjustments", JSON.stringify(adjustments));
      }}
      source={{
        uri:
          "https://www.slrlounge.com/wp-content/uploads/2020/06/best-landscape-photographers-to-follow-in-2020-1200x675.jpg",
      }}
    />
  );
}
