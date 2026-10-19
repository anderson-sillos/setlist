const {
  withAppBuildGradle,
  withGradleProperties,
} = require('@expo/config-plugins');

const LEGACY_PROGUARD_PRESET = 'getDefaultProguardFile("proguard-android.txt")';
const OPTIMIZED_PROGUARD_PRESET =
  'getDefaultProguardFile("proguard-android-optimize.txt")';
const OPTIMIZED_RESOURCE_SHRINKING_PROPERTY =
  'android.r8.optimizedResourceShrinking';

function withR8ReleaseOptimizations(config) {
  config = withAppBuildGradle(config, (config) => {
    const { contents } = config.modResults;

    if (!contents.includes(OPTIMIZED_PROGUARD_PRESET)) {
      const occurrences = contents.split(LEGACY_PROGUARD_PRESET).length - 1;
      if (occurrences !== 1) {
        throw new Error(
          'Could not find exactly one legacy Android ProGuard preset to replace with the R8 optimization preset.',
        );
      }

      config.modResults.contents = contents.replace(
        LEGACY_PROGUARD_PRESET,
        OPTIMIZED_PROGUARD_PRESET,
      );
    }

    return config;
  });

  return withGradleProperties(config, (config) => {
    // AGP 8.12 needs an explicit opt-in for optimized resource shrinking.
    const entries = config.modResults.filter(
      (entry) =>
        entry.type === 'property' &&
        entry.key === OPTIMIZED_RESOURCE_SHRINKING_PROPERTY,
    );

    if (entries.length > 1) {
      throw new Error(
        `Found duplicate Gradle property: ${OPTIMIZED_RESOURCE_SHRINKING_PROPERTY}`,
      );
    }

    if (entries.length === 1) {
      entries[0].value = 'true';
    } else {
      config.modResults.push({
        type: 'property',
        key: OPTIMIZED_RESOURCE_SHRINKING_PROPERTY,
        value: 'true',
      });
    }

    return config;
  });
}

module.exports = withR8ReleaseOptimizations;
