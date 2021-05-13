import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("screen");

export { SCREEN_WIDTH };
export const PADDING_HORIZONTAL = 15;
export const BOX_WIDTH = SCREEN_WIDTH - PADDING_HORIZONTAL * 2;
export const BOX_BORDER = 1;
export const BOX_INDICATOR_BORDER = 3;
export const BOX_INDICATOR_SIZE = 20;
