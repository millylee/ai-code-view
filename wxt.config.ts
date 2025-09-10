import { defineConfig } from 'wxt';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: '__MSG_extension_name__',
    description: '__MSG_extension_description__',
    default_locale: 'en',
    permissions: [
      'storage',
      'activeTab',
      'scripting',
      'tabs'
    ],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: '__MSG_extension_name__',
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true
    },
  },
  webExt: {
    // binaries: {
    //   chrome: 'pathtochrome.exe'
    // },
    // chromiumArgs: ["--auto-open-devtools-for-tabs"],
    disabled: true,
  }
});
