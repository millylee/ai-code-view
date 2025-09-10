export default defineBackground(() => {
  const openOptionsPage = async () => {
    const optionsUrl = browser.runtime.getURL('/options.html');
    
    const tabs = await browser.tabs.query({ url: optionsUrl });
    
    if (tabs.length > 0) {
      const tab = tabs[0];
      await browser.tabs.update(tab.id!, { active: true });
      if (tab.windowId) {
        await browser.windows.update(tab.windowId, { focused: true });
      }
    } else {
      await browser.tabs.create({
        url: optionsUrl,
        active: true
      });
    }
  };

  browser.action.onClicked.addListener(openOptionsPage);
});