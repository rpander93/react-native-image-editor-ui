import * as ImageManipulator from "expo-image-manipulator";
import * as React from "react";
import { ActivityIndicator, Button, Dimensions, Image, StyleSheet, Text, TextInput, View } from "react-native";
import ImageEditorScreen, { Adjustments } from "react-native-image-editor-ui";

const { width, height } = Dimensions.get("screen");

function PickImage({ loading, onSelected }: { loading: boolean; onSelected: (link: string) => void }) {
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
      {loading ? <ActivityIndicator color="black" /> : <Button onPress={handleOnDone} title="Done" />}
    </View>
  );
}

export default function App() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [croppedImage, setCroppedImage] = React.useState<ImageManipulator.ImageResult | null>(null);
  const [loadingSource, setLoadingSource] = React.useState(false);
  const [sourceImage, setSourceImage] = React.useState<{ uri: string; height: number; width: number } | null>();

  const handleOnSelectedImage = async (link: string) => {
    setLoadingSource(true);
    /**
     * Note: this is a "hack" to obtain the image dimensions.
     * Image.getSize cannot be used as it returns wrong results on Android. See https://github.com/facebook/react-native/issues/22145)
     */
    const imageForDimensions = await ImageManipulator.manipulateAsync(link, []);

    setSourceImage({ uri: link, height: imageForDimensions.height, width: imageForDimensions.width });
    setCurrentStep(1);
    setLoadingSource(false);
  };

  const handleOnCancel = () => {
    setCurrentStep(0);
    setSourceImage(null);
  };

  const handleOnDoneCropping = async ({ rotate, flipHorizontal, originX, originY, width, height }: Adjustments) => {
    if (!sourceImage) return;

    const manipulations: ImageManipulator.Action[] = [{ rotate }, { crop: { originX, originY, width, height } }];
    if (flipHorizontal) manipulations.push({ flip: ImageManipulator.FlipType.Horizontal });

    const manipulatedImage = await ImageManipulator.manipulateAsync(sourceImage.uri, manipulations);

    setCurrentStep(2);
    setCroppedImage(manipulatedImage);
  };

  if (currentStep === 0) {
    return <PickImage loading={loadingSource} onSelected={handleOnSelectedImage} />;
  }

  if (currentStep === 1) {
    return <ImageEditorScreen onCancel={handleOnCancel} onDone={handleOnDoneCropping} source={sourceImage} />;
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
