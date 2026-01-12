import { getGroupKeyByConfig, getGroupTitleByConfig, getGroupColorByConfig } from "./configuration.js";
import { getDomain, getSecDomain } from "./utils.js";

// 不做分组的策略
export const noGroupStrategy = {
  shloudGroup: () => {
    return false;
  },
  getGroupKey: () => {
    return null;
  },
  getGroupTitle: () => {
    return null;
  },
  querySameTabs: async () => {
    return [];
  },
};

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

// 根据配置文件分组的策略
export const configStrategy = {
  shloudGroup: (changeInfo, tab) => {
    return changeInfo.url && tab.url.match(/^https?:\/\/[^/]+\/.*/);
  },
  getGroupKey: (tab, userConfig) => {
    const result = getGroupKeyByConfig(tab.url, userConfig.configuration);
    return result
      ? result
      : getFallbackStattegy(userConfig.configuration.fallback).getGroupKey(tab);
  },
  getGroupTitle: (tab, userConfig) => {
    const result = getGroupTitleByConfig(tab.url, userConfig.configuration);
    return result
      ? result
      : getFallbackStattegy(userConfig.configuration.fallback).getGroupTitle(
        tab
      );
  },
  getGroupColor: (tab, userConfig) => {
    return getGroupColorByConfig(tab.url, userConfig.configuration);
  },
  querySameTabs: async (tab, userConfig) => {
    const domain = configStrategy.getGroupTitle(tab, userConfig);
    let tabs;
    await chrome.tabs
      .query({
        windowId: chrome.windows.WINDOW_ID_CURRENT,
        pinned: false,
      })
      .then((allTabs) => {
        tabs = allTabs.filter(
          (t) =>
            t.url &&
            domain === configStrategy.getGroupTitle(t, userConfig)
        );
      });
    return tabs;
  },
};

function getFallbackStattegy(fallback) {
  switch (fallback) {
    case 'none':
      return noGroupStrategy;
    case 'domain':
      return domainStrategy;
    case 'sld':
      return secDomainStrategy;
    default:
      return noGroupStrategy;
  }
}
