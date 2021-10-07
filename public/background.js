// 默认配置
const DEFAULT_GROUP = {
  enableAutoGroup: true, // 是否启动自动分组
  groupTabNum: 1, // 满足多少个tab时才进行分组
  groupStrategy: 1, // 分组策略，1.域名分组 2.tab名称匹配分组
  tabTitlePattern: "", // tab名称匹配的规则
}

let userConfig = DEFAULT_GROUP;
// 读取用户配置
chrome.storage.local.get(Object.keys(DEFAULT_GROUP), config => {
  if (config) {
    userConfig = { ...DEFAULT_GROUP, ...config };
  }
});
// 监听用户配置修改
chrome.storage.onChanged.addListener((changes) => {
  for (const key in changes) {
    if (Object.prototype.hasOwnProperty.call(userConfig, key)) {
      userConfig[key] = changes[key].newValue;
    }
  }
});

// 根据域名分组的策略
const domainStrategy = {
  shloudGroup: (changeInfo, tab) => {
    return changeInfo.url && tab.url.match(/^https?:\/\/[^/]+\/.*/);
  },
  getGroupTitle: tab => {
    return getDomain(tab.url);
  },
  querySameTabs: async tab => {
    const domain = getDomain(tab.url);
    let tabs;
    await chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT }).then(allTabs => {
      tabs = allTabs.filter(t => t.url && domain === getDomain(t.url));
    });
    return tabs;
  },
}
// 根据Tab标题分组的策略
const tabTitleStrategy = {
  shloudGroup: (changeInfo, tab) => {
    return changeInfo.title && userConfig.tabTitlePattern && tab.title.includes(userConfig.tabTitlePattern);
  },
  getGroupTitle: () => {
    return userConfig.tabTitlePattern;
  },
  querySameTabs: () => {
    const queryInfo = {
      title: `*${userConfig.tabTitlePattern}*`,
      windowId: chrome.windows.WINDOW_ID_CURRENT,
    };
    return chrome.tabs.query(queryInfo);
  },
}
// 定义分组策略
const GROUP_STRATEGY_MAP = new Map();
GROUP_STRATEGY_MAP.set(1, domainStrategy);
GROUP_STRATEGY_MAP.set(2, tabTitleStrategy);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 判断是否开启自动分组
  if (!userConfig.enableAutoGroup) {
    return;
  }

  const strategy = GROUP_STRATEGY_MAP.get(userConfig.groupStrategy);
  if (strategy.shloudGroup(changeInfo, tab)) {
    strategy.querySameTabs(tab).then(tabs => {
      if (tabs.length < userConfig.groupTabNum) {
        return;
      }
  
      const tabIds = tabs.map(t => t.id);
      const groupTitle = strategy.getGroupTitle(tab);
      // 查询分组，如果分组存在则加入分组，否则新建分组
      chrome.tabGroups.query({ 
        title: groupTitle, 
        windowId: chrome.windows.WINDOW_ID_CURRENT 
      }).then(tabGroups => {
        if (tabGroups && tabGroups.length > 0) {
          chrome.tabs.group({ tabIds, groupId: tabGroups[0].id })
        } else {
          chrome.tabs.group({ tabIds }).then(groupId => {
            chrome.tabGroups.update(groupId, { title: groupTitle });
          });
        }
      });
    });
  }
});

function getDomain(url) {
  const re = /^https?:\/\/([^/]+)\/.*/;
  const match = url.match(re);
  return match ? match[1] : null;
}
