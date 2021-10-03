// 一个分组的最小tab数
const groupTabNum = 2;
// 分组策略，1.域名分组 2.tab名称匹配分组
const groupStrategy = 1;
// tab名称匹配的规则
const tabNamePattern = "";
// 是否创建group时包含group名称
const showGroupName = true;

function getDomain(url) {
  const re = /^https?:\/\/([^\/]+)\/.*/;
  const match = url.match(re);
  return match[1];
}

/**
 * 返回和某tab相同域名的其他tab
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
 * 返回和该tab匹配的其他tab
 * 
 * @param {*} tab 
 * @returns Promise<tabs>
 */
function querySameTabs(tab) {
  if (groupStrategy === 1) {
    return querySameDomainTabs(tab);
  } else {
    return querySameNameRuleTabs(tab);
  }
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
      if (showGroupName) {
        const title = getDomain(tabs[0].url);
        chrome.tabGroups.update(groupId, {title});
      }
    });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 过滤更新url事件，加载新页面时会触发
  if (!changeInfo.status || !changeInfo.url) {
    return;
  }

  // 不匹配网页地址不做分组，主要针对 chrome:// 地址
  if (!/^https?:\/\/[^\/]+\/.*/.test(tab.url)) {
    return;
  };

  querySameTabs(tab).then(tabs => {
    tabs.push(tab);
    // 不满足分组数量，不进行分组
    if (tabs.length < groupTabNum) {
      return;
    }
    // 对所有满足规则的进行分组
    groupTabs(tabs);
  });
});
