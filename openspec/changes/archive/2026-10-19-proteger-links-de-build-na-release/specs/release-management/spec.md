# Spec Delta

## Purpose

Define how release records identify validated Android and iOS builds while keeping binary download addresses and temporary access credentials private from public release pages.

## ADDED Requirements

### Requirement: Public release records exclude private artifact links
Public release manifests, release notes, and Pages output SHALL NOT expose direct binary download URLs, signed URLs, access tokens, or other temporary credentials for Android or iOS artifacts.

#### Scenario: Publish release metadata
- **WHEN** a release manifest is attached to a published candidate or copied to Pages
- **THEN** the public data contains no direct AAB or IPA download URL and no temporary credential

### Requirement: Native builds retain verifiable public identity
The public release record SHALL identify each native build by platform, product version, build number, source commit, build profile, validation state, and a stable build-details reference without requiring a binary download link.

#### Scenario: Inspect a native build reference
- **WHEN** a user or reviewer opens the release record
- **THEN** they can identify the corresponding build and open its stable details page without receiving a direct artifact URL

### Requirement: Release validation preserves artifact checks privately
The release process SHALL verify native artifact type and build identity before marking validation as passed, while keeping any direct artifact address used for verification out of public records.

#### Scenario: Validate a store build
- **WHEN** the release process validates an Android AAB or iOS IPA
- **THEN** it confirms the artifact matches the tagged version, commit, platform, and authorized profile, and publishes only the validation result and safe build metadata

### Requirement: Pages rejects unsafe release records
The Pages workflow SHALL reject a release record containing a direct native artifact URL or temporary credential before copying release data to public output.

#### Scenario: Release record contains a signed download link
- **WHEN** a candidate manifest includes an EAS archive URL or temporary access parameter
- **THEN** the Pages workflow stops before publishing the manifest or application

#### Scenario: Deploy an existing candidate safely
- **WHEN** an authorized manual Pages deployment targets an already-created candidate tag
- **THEN** the deployment validates the safe release record and uses the exact tagged application source without moving the tag or changing the build identity
