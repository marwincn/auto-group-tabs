// 默认配置
const defaultConfig = {
  enableAutoGroup: true, // 是否启动自动分组
  groupTabNum: 1, // 满足多少个tab时才进行分组
  groupStrategy: 1, // 分组策略，1.域名分组 2.tab名称匹配分组
  tabTitlePattern: "", // tab名称匹配的规则
}

let userConfig = defaultConfig;
// 读取用户配置
chrome.storage.local.get(Object.keys(defaultConfig), config => {
  if (config) {
    userConfig = { ...defaultConfig, ...config };
  }
});

// 监听用户配置修改
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local") {
    for (const key in changes) {
      userConfig[key] = changes[key].newValue;
    }
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!shloudFireAction(changeInfo, tab)) {
    return;
  }

  querySameTabs(tab).then(tabs => {
    if (tabs.length < userConfig.groupTabNum) {
      return;
    }

    const tabIds = tabs.map(t => t.id);
    const groupTitle = getGroupTitle(tab);
    // 查询分组，如果分组存在则加入分组，否则新建分组
    chrome.tabGroups.query({ title: groupTitle }).then(tabGroups => {
      if (tabGroups && tabGroups.length > 0) {
        chrome.tabs.group({ tabIds, groupId: tabGroups[0].id })
      } else {
        chrome.tabs.group({ tabIds }).then(groupId => {
          chrome.tabGroups.update(groupId, { title: groupTitle });
        });
      }
    });
  });
});

function shloudFireAction(changeInfo, tab) {
  // 判断是否开启自动分组
  if (!userConfig.enableAutoGroup) {
    return false;
  }
  // 对于根据域名分组需要判断url
  if (userConfig.groupStrategy === 1) {
    return changeInfo.url && tab.url.match(/^https?:\/\/[^/]+\/.*/);
  }
  // 对于根据标题分组需要判断标题，Pattern不为空
  if (userConfig.groupStrategy === 2) {
    return changeInfo.title && userConfig.tabTitlePattern && tab.title.includes(userConfig.tabTitlePattern);
  }
  return false;
}

/**
 * 返回和该tab匹配的其他tab
 * 
 * @param {*} tab 
 * @returns Promise<tabs>
 */
function querySameTabs(tab) {
  switch (userConfig.groupStrategy) {
    case 1:
      return querySameDomainTabs(tab);
    case 2:
      return querySameTitlePattern();
    default:
      return new Promise(resolve => {
        resolve([]);
      });
  }
}

/**
 * 返回和tab相同域名的其他tab
 * 
 * @param {*} tab
 * @returns Promise<tabs>
 */
function querySameDomainTabs(tab) {
  const queryInfo = {
    url: `*://${getDomain(tab.url)}/*`,
  };
  return chrome.tabs.query(queryInfo);
}

/**
 * 返回和tab匹配相同标题的其他tab
 * 
 * @returns Promise<tabs>
 */
function querySameTitlePattern() {
  const queryInfo = {
    title: `*${userConfig.tabTitlePattern}*`,
  };
  return chrome.tabs.query(queryInfo);
}

function getGroupTitle(tab) {
  if (userConfig.groupStrategy === 1) {
    return getDomain(tab.url);
  }
  if (userConfig.groupStrategy === 2) {
    return userConfig.tabTitlePattern;
  }
  return '';
}

function getDomain(url) {
  const re = /^https?:\/\/([^/]+)\/.*/;
  const match = url.match(re);
  return match[1];
}
