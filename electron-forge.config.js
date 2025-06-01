module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "mimir",
    appCopyright: `Copyright © ${new Date().getFullYear()}`,
    icon: './src/assets/icon',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'mimir',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Mimir Team',
          homepage: 'https://mimir.app',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          maintainer: 'Mimir Team',
          homepage: 'https://mimir.app',
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be main process, preload scripts, worker process, etc.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/main/index.js',
            config: 'vite.config.js',
          },
          {
            entry: 'electron/preload.js',
            config: 'vite.config.js',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.config.js',
          },
        ],
      },
    },
  ],
};