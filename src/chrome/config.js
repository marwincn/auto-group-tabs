const defaultConfig = {
  enableAutoGroup: true, // 是否启动自动分组
  groupTabNum: 2, // 满足多少个tab时才进行分组
  groupStrategy: 1, // 分组策略，1.域名分组 2.tab名称匹配分组
  tabNamePattern: "", // tab名称匹配的规则
  showGroupName: true, // 是否创建group时包含group名称
}

export function setDefaultConfig() {
  return chrome.storage.sync.set(defaultConfig);
}

export function getAllConfig() {
  return chrome.storage.sync.get(Object.keys(defaultConfig));
}

export function setConfig(config) {
  return chrome.storage.sync.set(config);
}

