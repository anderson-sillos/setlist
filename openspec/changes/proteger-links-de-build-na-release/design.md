# Design

## Context

See `proposal.md` for the motivation. `scripts/release-manifest.mjs` currently copies `applicationArchiveUrl` from the private EAS build response into `artifactUrl`. `.github/workflows/pages.yml` requires that field and copies the manifest to both `release.json` and `app/release.json`. The workflow checks out the release tag, so a manual deployment of RC.4 currently runs the old validator from that tag.

The candidate tag must stay immutable, and Android/iOS builds must remain tied to the exact app commit. A manual deployment can select the updated workflow from `main` while checking out the tagged app source separately. The app export and the safe manifest can then be checked against the original RC.4 tag and build commit.

## Goals / Non-Goals

**Goals:**

- Keep public release records useful for identifying and verifying builds.
- Ensure direct artifact URLs and temporary credentials do not enter GitHub Release notes/assets or Pages output.
- Preserve exact tag, commit, product version, platform, profile, build number, and artifact-type checks.
- Allow the existing RC.4 candidate to use the safe Pages path without moving its tag or rebuilding native apps, if its current build evidence satisfies the updated private checks.

**Non-Goals:**

- Change how Google Play or App Store Connect distributes the native builds.
- Publish AAB or IPA files from GitHub Pages or as public GitHub Release assets.
- Change the product version, native build counters, or the R8 configuration tracked separately in task 11.8.10.

## Decisions

### Public manifest schema

Generate schema version 2 records with safe fields such as build ID, product version, native build number, commit, profile, distribution, validation state, and `buildDetailsUrl`. Construct the details reference from the trusted EAS account/project identity and build ID, using the canonical `expo.dev` build-details route and no query or fragment. Do not copy `applicationArchiveUrl` or any signed URL into the result. The private input can still be checked for expected host and file extension before it is discarded.

Validation must distinguish a trusted build-details reference from an artifact download URL. It must also scan the serialized manifest for legacy URL fields and query-bearing or signed download links, so a schema-1 manifest containing direct links cannot be accepted or copied to Pages.

### Keep artifact checks in the private build path

The local release process reads EAS build JSON and, when needed, retrieves the archive through the private EAS build URL into a temporary local directory. It checks build completion, platform, app version, tagged commit, authorized profile, distribution, and archive type before setting validation to `passed`. Temporary files and direct download addresses stay outside Git-tracked and public files. The public manifest records the outcome and safe identifiers only.

### Deploy candidates using trusted workflow code

For a manual candidate deployment, run `workflow_dispatch` from `main`. The workflow source and validator come from that selected ref; a separate checkout provides the app source at the exact release tag. It downloads the schema-2 manifest from the published candidate, verifies tag/commit/build metadata and absence of private links, then exports and publishes the app source from the tag. It must not move the tag or weaken the common-commit checks. Stable release deployments continue to use the tagged source after the updated workflow is included in that release.

This lets RC.4 use the corrected deployment path while retaining its current tag and native builds. If the existing EAS records cannot prove the required platform/profile/archive details without changing the build identity, stop the deployment and prepare a new candidate; do not alter or force-move RC.4.

### Update release documentation and records

Document that GitHub Releases and Pages contain safe build references only. Native distribution stays in Play Console and App Store Connect/TestFlight; EAS detail references may require account access to view or retrieve artifacts. Before publishing RC.4, inspect its draft notes and assets, remove any direct download URL, attach only a schema-2 manifest, and confirm the resulting public JSON contains no signed URL or token.

## Risks / Trade-offs

- [The EAS details URL may be inaccessible to people without project access] → Keep store tester links as the distribution path and describe the EAS reference as build identification, not an install link.
- [A workflow can accidentally use a stale or different tag checkout] → Verify the checked-out tag SHA, manifest commit, and each build commit before export; stop on any mismatch.
- [Older schema-1 releases include direct links] → Reject unsafe schema-1 data from public output; preserve old release records privately and migrate only drafts that have not been published.
- [RC.4 private evidence may not support a safe manifest] → Preserve the existing candidate unchanged and create a new tagged candidate with fresh builds if evidence cannot be established.

## Migration Plan

1. Implement and test schema-2 generation and strict rejection of direct archive URLs in public manifests.
2. Update the Pages workflow to run manual deployments from `main`, check out the candidate app source separately at its immutable tag, and accept only a safe schema-2 manifest.
3. Generate a sanitized RC.4 manifest from private EAS build records. Inspect draft notes and assets for direct or signed download links; attach only the sanitized manifest.
4. Validate the RC.4 manual Pages deployment against tag `v1.0.0-rc.4` and confirm both public release JSON copies contain no artifact URL or credential.
5. If an issue requires changing app source or native builds, create the next RC tag and builds rather than modifying RC.4.

Rollback: do not publish or redeploy an unsafe manifest. If a safe deployment fails, keep the current Pages version and the RC.4 draft/release state unchanged while correcting the workflow or preparing a new candidate.
