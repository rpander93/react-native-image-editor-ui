import * as React from "react";
import ImageCropper from "react-native-image-cropper";

export default function App() {
  return (
    <ImageCropper
      source={{
        uri: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Poster-sized_portrait_of_Barack_Obama.jpg",
      }}
    />
  );
}
