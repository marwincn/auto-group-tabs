import { getDomain, getSecDomain } from "./utils.js";

// 根据域名分组的策略
export const domainStrategy = {
    shloudGroup: (changeInfo, tab) => {
      return changeInfo.url && tab.url.match(/^https?:\/\/[^/]+\/.*/);
    },
    getGroupKey: (tab) => {
      return getDomain(tab.url);
    },
    getGroupTitle: (tab) => {
      return getDomain(tab.url);
    },
    querySameTabs: async (tab) => {
      const domain = getDomain(tab.url);
      let tabs;
      await chrome.tabs
        .query({
          windowId: chrome.windows.WINDOW_ID_CURRENT,
          pinned: false,
        })
        .then((allTabs) => {
          tabs = allTabs.filter((t) => t.url && domain === getDomain(t.url));
        });
      return tabs;
    },
  };
  
  // 根据二级域名分组的策略
  export const secDomainStrategy = {
    shloudGroup: (changeInfo, tab) => {
      return changeInfo.url && tab.url.match(/^https?:\/\/[^/]+\/.*/);
    },
    getGroupKey: (tab) => {
      return getSecDomain(tab.url);
    },
    getGroupTitle: (tab) => {
      return getSecDomain(tab.url);
    },
    querySameTabs: async (tab) => {
      const domain = getSecDomain(tab.url);
      let tabs;
      await chrome.tabs
        .query({
          windowId: chrome.windows.WINDOW_ID_CURRENT,
          pinned: false,
        })
        .then((allTabs) => {
          tabs = allTabs.filter((t) => t.url && domain === getSecDomain(t.url));
        });
      return tabs;
    },
  };