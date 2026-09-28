function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React, { useEffect } from 'react';
import { NativeModules, Platform, DeviceEventEmitter, StyleSheet } from 'react-native';
import { RNGoogleSigninButton } from './RNGoogleSiginButton';
const RNGoogleSignin = NativeModules.RNGoogleSignin;
export const GoogleSigninButton = ({
  onPress,
  style,
  ...rest
}) => {
  useEffect(() => {
    if (Platform.OS === 'ios') {
      return;
    }
    const clickListener = DeviceEventEmitter.addListener('RNGoogleSigninButtonClicked', () => {
      onPress === null || onPress === void 0 || onPress();
    });
    return () => {
      clickListener.remove();
    };
  }, [onPress]);
  const recommendedSize = (() => {
    switch (rest.size) {
      case RNGoogleSignin.BUTTON_SIZE_ICON:
        return styles.iconSize;
      case RNGoogleSignin.BUTTON_SIZE_WIDE:
        return styles.wideSize;
      default:
        return styles.standardSize;
    }
  })();

  // @ts-ignore style prop incompatible
  return /*#__PURE__*/React.createElement(RNGoogleSigninButton, _extends({}, rest, {
    onPress: onPress,
    style: [recommendedSize, style]
  }));
};
GoogleSigninButton.Size = {
  Icon: RNGoogleSignin.BUTTON_SIZE_ICON,
  Standard: RNGoogleSignin.BUTTON_SIZE_STANDARD,
  Wide: RNGoogleSignin.BUTTON_SIZE_WIDE
};
GoogleSigninButton.Color = {
  Dark: RNGoogleSignin.BUTTON_COLOR_DARK,
  Light: RNGoogleSignin.BUTTON_COLOR_LIGHT
};

// sizes according to https://developers.google.com/identity/sign-in/ios/reference/Classes/GIDSignInButton
const styles = StyleSheet.create({
  iconSize: {
    width: 48,
    height: 48
  },
  standardSize: {
    width: 230,
    height: 48
  },
  wideSize: {
    width: 312,
    height: 48
  }
});
//# sourceMappingURL=GoogleSigninButton.js.map