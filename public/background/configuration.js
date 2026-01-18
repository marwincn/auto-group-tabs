import { getDomain } from "./utils.js";

export const defaultConfiguration = {
  fallback: "none",
  rules: [],
};

export function getGroupKeyByConfig(url, configuration) {
  console.log(configuration.rules);
  for (let rule of configuration.rules) {
    for (let obj of rule.patterns) {
      if (obj.pattern) {
        // 根据匹配类型选择使用域名或完整URL进行匹配
        // matchType: 'domain' 或 'url'，默认为 'domain'（保持向后兼容）
        const matchType = obj.matchType || 'domain';
        const matchTarget = matchType === 'url' ? url : getDomain(url);
        
        if (matchTarget && isExpressionMatched(matchTarget, obj.pattern)) {
          return rule.name;
        }
      }
    }
  }
  return null;
}

export function getGroupTitleByConfig(url, configuration) {
  return getGroupKeyByConfig(url, configuration);
}

export function getGroupColorByConfig(url, configuration) {
  console.log(configuration.rules);
  for (let rule of configuration.rules) {
    for (let obj of rule.patterns) {
      if (obj.pattern) {
        // 根据匹配类型选择使用域名或完整URL进行匹配
        // matchType: 'domain' 或 'url'，默认为 'domain'（保持向后兼容）
        const matchType = obj.matchType || 'domain';
        const matchTarget = matchType === 'url' ? url : getDomain(url);
        
        if (matchTarget && isExpressionMatched(matchTarget, obj.pattern)) {
          return rule.color || "grey";
        }
      }
    }
  }
  return null;
}

function isExpressionMatched(matchTarget, expression) {
  // 转换表达式中的 * 为正则表达式中的 .*，并转义其他正则元字符
  const regexPattern = expression.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  // 构建正则表达式
  const regex = new RegExp(`^${regexPattern}$`);
  // 检查匹配目标（域名或完整URL）是否匹配表达式
  return regex.test(matchTarget);
}
