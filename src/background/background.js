// 默认配置
const defaultConfig = {
  enableAutoGroup: true, // 是否启动自动分组
  groupTabNum: 2, // 满足多少个tab时才进行分组
  groupStrategy: 1, // 分组策略，1.域名分组 2.tab名称匹配分组
  tabTitlePattern: "", // tab名称匹配的规则
  showGroupName: true, // 是否创建group时包含group名称
}

let userConfig = defaultConfig;
// 读取用户配置
chrome.storage.local.get(Object.keys(defaultConfig), config => {
  if (config) {
    userConfig = {...defaultConfig, ...config};
  }
});

// 监听用户配置修改
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local") {
    for(const key in changes) {
      userConfig[key] = changes[key].newValue;
    }
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!shloudFireAction(changeInfo, tab)) {
    return;
  }

  querySameTabs(tab).then(tabs => {
    tabs.push(tab);
    // 不满足分组数量，不进行分组
    if (tabs.length < userConfig.groupTabNum) {
      return;
    }
    // 对所有满足规则的进行分组
    groupTabs(tabs);
  });
});

function shloudFireAction(changeInfo, tab) {
  // 判断是否开启自动分组
  if (!userConfig.enableAutoGroup) {
    return false;
  }
  // 对于根据域名分组需要判断url
  if (userConfig.groupStrategy === 1) {
    return changeInfo.url && tab.url.match(/^https?:\/\/[^\/]+\/.*/);
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
      return querySameTitlePattern(tab);
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
  // 查询状态为complete的tab，避免更新url时查询到自己而没有重新分组
  const queryInfo = {
    url : `*://${getDomain(tab.url)}/*`,
    status: "complete",
  };
  return chrome.tabs.query(queryInfo);
}

/**
 * 返回和tab匹配相同标题的其他tab
 * 
 * @param {*} tab
 * @returns Promise<tabs>
 */
 function querySameTitlePattern(tab) {
  // 查询状态为complete的tab，避免更新url时查询到自己而没有重新分组
  const queryInfo = {
    title : `*${userConfig.tabTitlePattern}*`,
    status: "complete",
  };
  return chrome.tabs.query(queryInfo);
}

/**
 * 将tabs分到一个组
 * 
 * @param {*} tabs 
 */
function groupTabs(tabs) {
  const tabIds = tabs.map(tab => tab.id);
  // 找到第一个已有分组的tab，将所有tab分到该组
  const firstTab = tabs.find(tab => tab.groupId !== -1);
  if (firstTab) {
    chrome.tabs.group({tabIds, groupId: firstTab.groupId});
  } else {
    chrome.tabs.group({tabIds}).then(groupId => {
      if (userConfig.showGroupName) {
        const title = getDomain(tabs[0].url);
        chrome.tabGroups.update(groupId, {title});
      }
    });
  }
}

function getDomain(url) {
  const re = /^https?:\/\/([^\/]+)\/.*/;
  const match = url.match(re);
  return match[1];
}
