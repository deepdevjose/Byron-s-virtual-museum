# Project Overview

## Project Name

Byron Galvez Virtual Museum

## Short Description

The project is a static web-based virtual museum built with Three.js and WebGL. It presents a 3D gallery dedicated to Byron Galvez, with first-person navigation, framed artwork displays, metadata panels, artwork detail modals, ambient audio, credits, and a guided tour mode.

## Purpose

The purpose is to provide an interactive cultural experience that can run in a modern web browser without requiring a native application. The museum combines spatial navigation with artwork metadata and media playback so visitors can explore the collection either freely or through a guided sequence.

## Target Audience

- Visitors interested in Byron Galvez and digital cultural experiences.
- Portfolio reviewers evaluating interactive web and Three.js work.
- Developers studying modular Three.js application structure.
- Future maintainers adding artwork, media, or documentation.

## Main Features

- Static HTML entry point with an ES module app bootstrap.
- Three.js scene with a procedurally built gallery environment.
- First-person desktop navigation through keyboard and pointer lock.
- Mobile touch controls with joystick and look area.
- Artwork records loaded from `src/data/artworks.json`.
- Framed artwork meshes with image textures and generated wall labels.
- Center-screen raycasting for artwork hover and selection.
- Artwork panel and detail modal with image, audio, or video content.
- Guided tour mode with generated camera stops.
- Credits modal and tour completion flow.
- Utility scripts for artwork validation, smoke testing, and browser-console performance checks.

## Current Project Status

The repository contains an implemented single-room virtual museum experience. Cloudinary video URLs are already present in artwork metadata, and the artwork detail modal can create video elements from those URLs. Some optimization and validation work remains pending, including formal performance measurements, optimized Cloudinary transformation rollout, and stronger video cleanup on modal close.

## High-Level Technology Stack

- Three.js r128 loaded through an import map in `index.html`.
- WebGL rendering through `THREE.WebGLRenderer`.
- JavaScript ES modules under `src/js/`.
- HTML and CSS for static structure and overlays.
- JSON for artwork data.
- Cloudinary delivery URLs for externally hosted artwork videos.

## Relevance As A Web-Based Virtual Museum

The project demonstrates how a browser can support a museum-like spatial experience with real-time graphics, curated metadata, and multimedia overlays. It is relevant because it avoids native installation, keeps source assets manageable, and uses web technologies that can be deployed on static hosting.
