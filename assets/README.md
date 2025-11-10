# Application Assets

This directory contains assets for the X-TEC Digital Reporting application.

## Application Icons

To ensure the application has the correct icon for the installer, desktop shortcuts, and window frames, please follow these steps:

### Windows (`.ico`)

1.  **File Format**: The application requires an icon in the `.ico` format for Windows builds. This is a specific format that contains multiple image sizes.
2.  **File Name**: The icon file **must be named `icon.ico`**.
3.  **Location**: Place the `icon.ico` file directly inside this `/assets` directory.
4.  **How to Create**: If you only have a PNG or JPG version of your icon, you can easily convert it to the required `.ico` format using a free online converter tool. Search for "PNG to ICO converter". A good `.ico` file should include multiple sizes (like 256x256, 48x48, 32x32, and 16x16) for best results on Windows.

### macOS (`.icns`)

1.  **File Format**: The application requires an icon in the `.icns` format for macOS builds.
2.  **File Name**: The icon file **must be named `icon.icns`**.
3.  **Location**: Place the `icon.icns` file directly inside this `/assets` directory.
4.  **How to Create**: You can use online converters to create an `.icns` file from a PNG. Search for "PNG to ICNS converter". For best results, start with a high-resolution square image (e.g., 1024x1024).

The build process is already configured in `forge.config.js` to automatically find and use the correct icon for each platform.
