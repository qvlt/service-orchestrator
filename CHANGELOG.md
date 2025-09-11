# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of @qvlt/service-orchestrator
- Job orchestration for background task management
- Browser-based job scheduling with multiple schedule types
- Cross-tab coordination and persistence
- Comprehensive job lifecycle management
- Progress reporting and monitoring capabilities
- Browser capability detection and validation
- Example project with interactive demonstrations
- Comprehensive test suite with Vitest
- TypeScript support with full type definitions

### Features

- **Job Scheduling**: Support for interval, one-shot, and finite schedules
- **Concurrency Control**: Skip, allow, and wait strategies for job execution
- **Progress Reporting**: Real-time progress tracking with custom messages
- **Cross-tab Coordination**: Synchronized job execution across browser tabs
- **Persistent Storage**: IndexedDB-based job persistence and recovery
- **Browser Capabilities**: Automatic detection of required browser features
- **Job Monitoring**: Real-time job status and history tracking
- **Manual Triggering**: On-demand job execution capabilities
- **Resource Management**: Proper cleanup and disposal mechanisms
- **Error Handling**: Comprehensive error management and recovery

### Technical

- **Browser-only**: Optimized for web browser environments
- **IndexedDB Storage**: Persistent job storage and cross-tab synchronization
- **Web Locks API**: Prevents duplicate job execution across tabs
- **Broadcast Channel**: Cross-tab communication and coordination
- **Service Worker Ready**: Compatible with service worker environments
- **ESM Support**: Modern ES modules with TypeScript definitions
- **Dual Build**: ESM and CommonJS output formats

## [0.0.1] - 2024-09-11

### Added

- Initial release
- Core job orchestration functionality
- Browser capability detection
- Example project and documentation
- GitHub Actions CI/CD
- Governance files and issue templates
- Comprehensive test suite
