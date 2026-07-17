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

// 等待 Chrome 完成新标签的初始分组继承，再按最终状态自动分组
const AUTO_GROUP_DEBOUNCE_MS = 150;
const autoGroupTimers = new Map();
let isGroupingAllTabs = false;

// 定义分组策略
const GROUP_STRATEGY_MAP = new Map();
GROUP_STRATEGY_MAP.set(1, domainStrategy);
GROUP_STRATEGY_MAP.set(2, secDomainStrategy);
GROUP_STRATEGY_MAP.set(3, configStrategy);

// 监听tab变更事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG), (config) => {
    userConfig = { ...DEFAULT_CONFIG, ...config };
    // 判断是否开启自动分组
    if (!userConfig.enableAutoGroup) {
      cancelAutoGroup(tabId);
      return;
    }

    // 如果不是http协议则ungroup掉
    if (!(tab.url.startsWith("http") || tab.url.startsWith("https"))) {
      cancelAutoGroup(tabId);
      // 如果用户手动拖拽tab到group中则ungroup会抛异常
      chrome.tabs.ungroup([tabId]).catch((error) => {
        console.error(`Failed to ungroup tab ${tabId}:`, error);
      });
    }

    const strategy = GROUP_STRATEGY_MAP.get(userConfig.groupStrategy);
    // 如果满足group的条件，进行group
    if (strategy.shloudGroup(changeInfo, tab)) {
      scheduleAutoGroup(tabId, strategy);
    } else if (changeInfo.groupId !== undefined && autoGroupTimers.has(tabId)) {
      // 新标签可能先继承来源 group；归属继续变化时重新等待稳定
      scheduleAutoGroup(tabId, strategy);
    }

    // 如果有tab从分组中移除，需要判断group的数量是否还满足数量，如果不满足ungroup
    if (changeInfo.groupId && changeInfo.groupId === -1) {
      strategy
        .querySameTabs(tab, userConfig)
        .then((tabs) => {
          const tabIds = tabs.map((t) => t.id);
          // 如果tab数量不满足设置最小数量进行ungroup
          if (tabs.length > 0 && tabs.length < userConfig.groupTabNum) {
            return chrome.tabs.ungroup(tabIds);
          }
        })
        .catch((error) => {
          console.error(`Failed to update group after removing tab ${tabId}:`, error);
        });
    }
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  cancelAutoGroup(tabId);
});

function cancelAutoGroup(tabId) {
  const timer = autoGroupTimers.get(tabId);
  if (timer !== undefined) {
    clearTimeout(timer);
    autoGroupTimers.delete(tabId);
  }
}

function scheduleAutoGroup(tabId, strategy) {
  cancelAutoGroup(tabId);
  const timer = setTimeout(async () => {
    autoGroupTimers.delete(tabId);
    try {
      const latestTab = await chrome.tabs.get(tabId);
      await groupTabs(latestTab, strategy);
    } catch (error) {
      // 标签在防抖期间关闭属于正常情况，无需报错
      if (!String(error && error.message).includes(`No tab with id: ${tabId}`)) {
        console.error(`Failed to auto group tab ${tabId}:`, error);
      }
    }
  }, AUTO_GROUP_DEBOUNCE_MS);
  autoGroupTimers.set(tabId, timer);
}

async function groupTabs(tab, strategy) {
  try {
    const tabs = await strategy.querySameTabs(tab, userConfig);
    if (tabs.length === 0) {
      console.log("no same tab for:" + tab);
      return;
    }

    const tabIds = tabs.map((t) => t.id);
    // 如果tab数量不满足设置最小数量进行ungroup
    if (tabIds.length < userConfig.groupTabNum) {
      await chrome.tabs.ungroup(tabIds);
      return;
    }
    // 查询分组，如果分组存在则加入分组，否则新建分组
    const groupTitle = strategy.getGroupTitle(tab, userConfig);
    if (groupTitle) {
      const tabGroups = await chrome.tabGroups.query({
        title: groupTitle,
        windowId: chrome.windows.WINDOW_ID_CURRENT,
      });
      if (tabGroups && tabGroups.length > 0) {
        await chrome.tabs.group({ tabIds, groupId: tabGroups[0].id });
      } else {
        // Chrome 会让新标签继承来源 group。先显式移出旧 group，避免在
        // 创建新 group 时同时拆分来源 group 导致浏览器界面卡顿。
        const groupedTabIds = tabs
          .filter((sameTab) => sameTab.groupId !== -1)
          .map((sameTab) => sameTab.id);
        if (groupedTabIds.length > 0) {
          await chrome.tabs.ungroup(groupedTabIds);
        }
        const groupId = await chrome.tabs.group({
          tabIds,
          createProperties: { windowId: tab.windowId },
        });
        const updateOptions = { title: groupTitle };
        // 如果策略支持自定义颜色，则应用颜色
        if (strategy.getGroupColor) {
          const color = strategy.getGroupColor(tab, userConfig);
          if (color) {
            updateOptions.color = color;
          }
        }
        await chrome.tabGroups.update(groupId, updateOptions);
      }
    }
  } catch (error) {
    console.error(`Failed to group tab ${tab.id}:`, error);
  }
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

async function groupAllTabs() {
  if (isGroupingAllTabs) {
    return;
  }

  isGroupingAllTabs = true;
  try {
    const config = await chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG));
    userConfig = { ...DEFAULT_CONFIG, ...config };
    const tabs = await chrome.tabs.query({
      windowId: chrome.windows.WINDOW_ID_CURRENT,
      pinned: false,
    });
    if (tabs.length === 0) {
      return;
    }

    const strategy = GROUP_STRATEGY_MAP.get(userConfig.groupStrategy);
    const tabsByGroupTitle = new Map();
    tabs.forEach((tab) => {
      const groupTitle = strategy.getGroupTitle(tab, userConfig);
      if (groupTitle) {
        const sameGroupTabs = tabsByGroupTitle.get(groupTitle) || [];
        sameGroupTabs.push(tab);
        tabsByGroupTitle.set(groupTitle, sameGroupTabs);
      }
    });

    // 顺序执行且只移动归属错误的标签，避免并发重建全部 group 卡住 Chrome
    for (const [groupTitle, sameGroupTabs] of tabsByGroupTitle) {
      if (sameGroupTabs.length < userConfig.groupTabNum) {
        const groupedTabIds = sameGroupTabs
          .filter((tab) => tab.groupId !== -1)
          .map((tab) => tab.id);
        if (groupedTabIds.length > 0) {
          await chrome.tabs.ungroup(groupedTabIds);
        }
        continue;
      }

      const existingGroups = await chrome.tabGroups.query({
        title: groupTitle,
        windowId: tabs[0].windowId,
      });
      let groupId;
      let existingGroup;
      if (existingGroups.length > 0) {
        existingGroup = existingGroups[0];
        groupId = existingGroup.id;
        const tabIdsToMove = sameGroupTabs
          .filter((tab) => tab.groupId !== groupId)
          .map((tab) => tab.id);
        if (tabIdsToMove.length > 0) {
          await chrome.tabs.group({ tabIds: tabIdsToMove, groupId });
        }
      } else {
        const groupedTabIds = sameGroupTabs
          .filter((tab) => tab.groupId !== -1)
          .map((tab) => tab.id);
        if (groupedTabIds.length > 0) {
          await chrome.tabs.ungroup(groupedTabIds);
        }
        groupId = await chrome.tabs.group({
          tabIds: sameGroupTabs.map((tab) => tab.id),
          createProperties: { windowId: tabs[0].windowId },
        });
      }

      const updateOptions = {};
      if (!existingGroup) {
        updateOptions.title = groupTitle;
      }
      if (strategy.getGroupColor) {
        const color = strategy.getGroupColor(sameGroupTabs[0], userConfig);
        if (color && (!existingGroup || existingGroup.color !== color)) {
          updateOptions.color = color;
        }
      }
      if (Object.keys(updateOptions).length > 0) {
        await chrome.tabGroups.update(groupId, updateOptions);
      }
    }
  } catch (error) {
    console.error("Failed to group all tabs:", error);
  } finally {
    isGroupingAllTabs = false;
  }
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
