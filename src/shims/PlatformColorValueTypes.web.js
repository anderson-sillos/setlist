// react-native-web does not expose native semantic/dynamic platform colors.
// Returning null lets React Native's processColor fall back to normal colors.
export function processColorObject() {
  return null;
}
