import "./style.css";
import ReactDOM from "react-dom/client";
import { App } from "./App";

export default defineContentScript({
  matches: ["*://*.github.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    let currentUi: any = null;

    const mountUi = async () => {
      const repoPath = extractGitHubRepoPath();
      if (!repoPath) {
        console.log(i18n.t('content.log.repo_path_not_found'));
        return;
      }

      // If UI already exists, unmount it first
      if (currentUi) {
        currentUi.remove();
        currentUi = null;
      }

      const anchor = document.querySelector('.AppHeader-globalBar-end .AppHeader-search') as HTMLElement || document.querySelector('#repository-details-container') as HTMLElement;
      if (!anchor) {
        console.log(i18n.t('content.log.anchor_not_found'));
        return;
      }

      currentUi = await createShadowRootUi(ctx, {
        name: "ai-code-view",
        position: "inline",
        anchor,
        append: "before",
        onMount: (container) => {
          const buttonContainer = anchor.parentElement as HTMLElement;
          if (buttonContainer) {
            buttonContainer.style.display = 'flex';
            buttonContainer.style.alignItems = 'center';
            buttonContainer.style.gap = '8px';
          }

          const root = ReactDOM.createRoot(container);
          root.render(<App repoPath={repoPath} />);
          return root;
        },
      });

      currentUi.mount();
    };

    // Initial mount
    await mountUi();

    // Listen for route changes
    ctx.addEventListener(window, 'wxt:locationchange', async ({ newUrl }) => {
      console.log(i18n.t('content.log.route_change'), newUrl);
      // Delay a bit to wait for DOM updates
      setTimeout(mountUi, 100);
    });
  },
});

/**
 * Extract repository path from current GitHub URL
 */
function extractGitHubRepoPath(): string | null {
  try {
    const pathname = window.location.pathname.replace(/^\//, "");
    const pathParts = pathname.split("/");

    if (pathParts.length < 2) return null;

    const owner = pathParts[0];
    const repo = pathParts[1];

    if (!owner || !repo) return null;

    // Exclude special paths
    const excludedPaths = [
      "orgs",
      "users",
      "topics",
      "collections",
      "explore",
      "settings",
    ];
    if (excludedPaths.includes(owner)) return null;

    return `${owner}/${repo}`;
  } catch (error) {
    console.error(i18n.t('content.log.repo_path_extraction_failed'), error);
    return null;
  }
}
