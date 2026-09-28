"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GoogleSigninButton = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _RNGoogleSiginButton = require("./RNGoogleSiginButton");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const RNGoogleSignin = _reactNative.NativeModules.RNGoogleSignin;
const GoogleSigninButton = ({
  onPress,
  style,
  ...rest
}) => {
  (0, _react.useEffect)(() => {
    if (_reactNative.Platform.OS === 'ios') {
      return;
    }
    const clickListener = _reactNative.DeviceEventEmitter.addListener('RNGoogleSigninButtonClicked', () => {
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
  return /*#__PURE__*/_react.default.createElement(_RNGoogleSiginButton.RNGoogleSigninButton, _extends({}, rest, {
    onPress: onPress,
    style: [recommendedSize, style]
  }));
};
exports.GoogleSigninButton = GoogleSigninButton;
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
const styles = _reactNative.StyleSheet.create({
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