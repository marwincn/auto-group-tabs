import { defaultConfiguration } from "./configuration.js";
import { configStrategy, domainStrategy, secDomainStrategy } from "./strategy.js";

// 默认配置
const DEFAULT_CONFIG = {
  enableAutoGroup: true, // 是否启动自动分组
  groupTabNum: 1, // 满足多少个tab时才进行分组
  groupStrategy: 2, // 分组策略
  configuration: defaultConfiguration // 配置文件内容
};
// 全局的用户配置
let userConfig = DEFAULT_CONFIG;

// 定义分组策略
const GROUP_STRATEGY_MAP = new Map();
GROUP_STRATEGY_MAP.set(1, domainStrategy);
GROUP_STRATEGY_MAP.set(2, secDomainStrategy);
GROUP_STRATEGY_MAP.set(2, configStrategy);

// 监听tab变更事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG), (config) => {
    userConfig = { ...DEFAULT_CONFIG, ...config };
    // 判断是否开启自动分组
    if (!userConfig.enableAutoGroup) {
      return;
    }

    // 如果不是http协议则ungroup掉
    if (!(tab.url.startsWith("http") || tab.url.startsWith("https"))) {
      // 如果用户手动拖拽tab到group中则ungroup会抛异常
      try {
        chrome.tabs.ungroup([tabId]);
      } catch (e) {
        console.error(e);
      }
    }

    const strategy = GROUP_STRATEGY_MAP.get(userConfig.groupStrategy);
    // 如果满足group的条件，进行group
    if (strategy.shloudGroup(changeInfo, tab)) {
      groupTabs(tab, strategy);
    }

    // 如果有tab从分组中移除，需要判断group的数量是否还满足数量，如果不满足ungroup
    if (changeInfo.groupId && changeInfo.groupId === -1) {
      strategy.querySameTabs(tab, userConfig).then((tabs) => {
        const tabIds = tabs.map((t) => t.id);
        // 如果tab数量不满足设置最小数量进行ungroup
        if (tabs.length > 0 && tabs.length < userConfig.groupTabNum) {
          chrome.tabs.ungroup(tabIds);
        }
      });
    }
  });
});

function groupTabs(tab, strategy) {
  strategy.querySameTabs(tab, userConfig).then((tabs) => {
    if (tabs.length === 0) {
      console.log("no same tab for:" + tab);
      return;
    }

    const tabIds = tabs.map((t) => t.id);
    // 如果tab数量不满足设置最小数量进行ungroup
    if (tabIds.length < userConfig.groupTabNum) {
      chrome.tabs.ungroup(tabIds);
      return;
    }
    // 查询分组，如果分组存在则加入分组，否则新建分组
    const groupTitle = strategy.getGroupTitle(tab, userConfig);
    if (groupTitle) {
      chrome.tabGroups
        .query({
          title: groupTitle,
          windowId: chrome.windows.WINDOW_ID_CURRENT,
        })
        .then((tabGroups) => {
          if (tabGroups && tabGroups.length > 0) {
            chrome.tabs.group({ tabIds, groupId: tabGroups[0].id });
          } else {
            chrome.tabs.group({ tabIds }).then((groupId) => {
              chrome.tabGroups.update(groupId, { title: groupTitle });
            });
          }
        });
    }
  });
}

// 监听一键分组点击事件
chrome.runtime.onMessage.addListener((request) => {
  if (request.groupRightNow) {
    groupAllTabs();
  }
});

// 监听一键group快捷键
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case "group_right_now": {
      groupAllTabs();
    }
  }
});

function groupAllTabs() {
  chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG), (config) => {
    userConfig = { ...DEFAULT_CONFIG, ...config };
    chrome.tabs
    .query({ windowId: chrome.windows.WINDOW_ID_CURRENT, pinned: false })
    .then((tabs) => {
      const strategy = GROUP_STRATEGY_MAP.get(userConfig.groupStrategy);
      // 按groupTitle分组，key为groupTitle，value为tabs
      let tabGroups = {};
      tabs.forEach((tab) => {
        const groupTitle = strategy.getGroupTitle(tab, userConfig);
        if (groupTitle) {
          if (!tabGroups[groupTitle]) {
            tabGroups[groupTitle] = [];
          }
          tabGroups[groupTitle].push(tab);
        }
      });
      // 调用chrome API 进行tabs分组
      for (const groupTitle in tabGroups) {
        const tabIds = tabGroups[groupTitle].map((tab) => tab.id);
        if (tabGroups[groupTitle].length >= userConfig.groupTabNum) {
          chrome.tabs.group({ tabIds }).then((groupId) => {
            chrome.tabGroups.update(groupId, { title: groupTitle });
          });
        } else {
          chrome.tabs.ungroup(tabIds);
        }
      }
    });
  });
}

// function mergeSameTabs() {
//   chrome.tabs
//     .query({ windowId: chrome.windows.WINDOW_ID_CURRENT })
//     .then((tabs) => {
//       let tabGroups = {};
//       tabs.forEach((tab) => {
//         let key = tab.url;
//         if (key) {
//           key = key.split("#")[0];
//           if (!tabGroups[key]) {
//             tabGroups[key] = [tab];
//           } else {
//             chrome.tabs.remove(tab.id);
//           }
//         }
//       });
//     });
// }
