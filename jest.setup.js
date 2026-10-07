/* global jest */

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    View: jest.requireActual('react-native').View,
    createAnimatedComponent: (component) => component,
  },
  interpolateColor: jest.fn(() => null),
  useAnimatedStyle: jest.fn(() => ({})),
  useSharedValue: jest.fn((value) => ({
    value,
    set(nextValue) {
      this.value = nextValue;
    },
  })),
  withTiming: jest.fn((value) => value),
}));
