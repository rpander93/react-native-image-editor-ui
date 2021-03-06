# 📐 react-native-image-editor-ui

Provides an user interface to crop and rotate (local or remote) images a la iOS Photos or WhatsApp. This package does *not* contain code to perform the actual manipulations. This should be done using another library (e.g. `expo-image-manipulator`) or in the back-end.

This package renders at 60fps by leveraging `react-native-reanimated` and `react-native-gesture-handler` to handle the cropper interactions. This ensures a smooth experience for your users.

## Installation

Before installing, make sure you have `react-native-reanimated@^2` and `react-native-gesture-handler` and configured. No other external dependencies are required.

```sh
yarn add react-native-image-editor-ui
```

## Usage

The default export is a full-screen component that shows a basic cropping UI. It contains a cancel, done, reset, flip & rotate button. Note that you *MUST* pass in the image dimensions (width, height). Unfortunately, the `Image.getSize` method cannot be used as it returns wrong results on Android. See [this issue](https://github.com/facebook/react-native/issues/22145).

[See an example screenshot here](assets/cropscreen_example.png).

```typescript
import ImageEditorScreen, { Adustments } from "react-native-image-editor-ui";

const handleOnCancel = () => {
  // ..
};

const handleOnDone = ({ rotate, flipHorizontal, originX, originY, width, height }: Adjustments) => {
  // ..
};

<ImageEditorScreen onCancel={handleOnCancel} onDone={handleOnDone} source={{ uri: "https://some.remote.example/image.png", width: 1200, height: 750,  }} useBackgroundCover={true} />
```

If you need more flexibility, you can also use the Cropper component directly which you can integrate in your own UI. Again, you *MUST* pass in the image dimensions (width, height). See also [src/EditorScreen.tsx](src/EditorScreen.tsx) for an example implementation.

```typescript
import * as React from "react";
import { EditBox, Adustments, RotationAngles } from "react-native-image-editor-ui";

const ref = React.useRef<React.ElementRef<typeof EditBox>>();

/* Following methods are available */
ref.current?.calculateAdjustments(); // --> returns object of shape `Adjustments`
ref.current?.flip();                 // --> flips image horizontally
ref.current?.reset();                // --> resets bounding box, rotation to original values
ref.current?.rotate(90);             // --> rotates image. only values in 90 degrees interval are accepted

<EditBox ref={ref} gridlines maxWidth={300} maxHeight={500} source={{ uri: "https://some.remote.example/image.png", width: 1200, height: 750 }} />
```

## Example

Refer to [example/src/App.tsx](example/src/App.tsx) for a working example including integration with expo-image-manipulator.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
