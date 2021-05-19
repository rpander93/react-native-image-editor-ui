import * as ImageManipulator from "expo-image-manipulator";
import * as React from "react";
import { Button, Dimensions, Image, StyleSheet, Text, TextInput, View } from "react-native";
import ImageCropper, { Adjustments } from "react-native-image-cropper";

const { width, height } = Dimensions.get("screen");

function PickImage({ onSelected }: { onSelected: (link: string) => void }) {
  const [currentValue, setCurrentValue] = React.useState(
    "https://upload.wikimedia.org/wikipedia/commons/f/f9/Amsterdam_-_Rijksmuseum_-_panoramio_-_Nikolai_Karaneschev.jpg"
  );

  const handleOnDone = () => {
    onSelected(currentValue);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Paste an image URL to crop</Text>
      <TextInput onChangeText={value => setCurrentValue(value)} value={currentValue} style={styles.input} />
      <Button onPress={handleOnDone} title="Done" />
    </View>
  );
}

export default function App() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [croppedImage, setCroppedImage] = React.useState<ImageManipulator.ImageResult | null>(null);
  const [originalImage, setOriginalImage] = React.useState<string | null>(null);

  const handleOnSelectedImage = (link: string) => {
    setCurrentStep(1);
    setOriginalImage(link);
  };

  const handleOnCancel = () => {
    setCurrentStep(0);
    setOriginalImage(null);
  };

  const handleOnDoneCropping = async ({ rotate, originX, originY, width, height }: Adjustments) => {
    const manipulatedImage = await ImageManipulator.manipulateAsync(originalImage as string, [
      { rotate },
      { crop: { originX, originY, width, height } },
    ]);

    setCroppedImage(manipulatedImage);
    setCurrentStep(2);
  };

  if (currentStep === 0) {
    return <PickImage onSelected={handleOnSelectedImage} />;
  }

  if (currentStep === 1) {
    return <ImageCropper onCancel={handleOnCancel} onDone={handleOnDoneCropping} source={{ uri: originalImage }} />;
  }

  return (
    <View style={styles.container}>
      <Image resizeMode="contain" source={croppedImage} style={{ maxWidth: width - 40, maxHeight: height * 0.75 }} />
      <Button onPress={handleOnCancel} title="Start again" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  input: {
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 4,
    padding: 5,
  },
  text: {
    fontWeight: "bold",
    marginVertical: 5,
  },
});
