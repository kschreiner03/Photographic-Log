module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'assets/icon' // no file extension required
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        certificateFile: './cert.pfx',
        certificatePassword: process.env.CERTIFICATE_PASSWORD
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` specifies the Vite build configurations.
        build: [
          {
            // `entry` is the path to the renderer's main script.
            entry: 'main.js',
            config: 'vite.main.config.ts',
          },
          {
            entry: 'preload.js',
            config: 'vite.preload.config.ts',
          },
        ],
        // `renderer` specifies the Vite dev server configurations.
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.ts',
          },
        ],
      },
    },
  ],
};
