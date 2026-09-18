# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.0.5] - 2026-09-18

### Added

- Added cancellable generation progress with an opt-out setting.
- Added unstaged and untracked text file analysis when the staging area is empty.
- Added repository selection for multi-root workspaces and repository-specific generation state.
- Added configurable Diff length limits and automated core tests.

### Changed

- Improved generation latency through parallel Git operations, lockfile Diff compaction, and throttled streaming UI updates.
- Improved API error details with HTTP status, error code, request ID, and API Key redaction.
- Updated the extension icon with transparent corners for dark and light themes.
- Improved publishing quality checks and release validation.

### Fixed

- Fixed cancellation and timeout responses being treated as successful generations.
- Fixed overlapping generation tasks updating the wrong SCM input or token session.
- Fixed all repositories showing the stop icon when only one repository was generating.
- Fixed existing SCM drafts being lost when generation failed or was cancelled.
- Fixed repository path prefix collisions and worktree Git directory detection.

## [1.0.4] - 2026-04-23

### Added

- Added an improved Token usage statistics view with clipboard copy support.

## [1.0.3] - 2026-04-23

### Changed

- Clarified prompt rules so Conventional Commit identifiers remain in English.

### Fixed

- Fixed cancelled generation tasks continuing to update the SCM input box.

## [1.0.2] - 2026-04-23

### Changed

- Improved automated packaging, release notes, tag detection, and Marketplace publishing.

## [1.0.0] - 2026-04-22

### Added

- Initial release of Commit Message Generator.
- AI-powered git commit message generation.
- Streaming output support.
- Auto-stage changes option.
- Multi-root workspace support.
- Token usage statistics and tracking.
