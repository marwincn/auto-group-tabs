import { getDomain } from "./utils.js";

export const defaultConfiguration = {
  fallback: "none",
  rules: [],
};

export function getGroupKeyByConfig(url, configuration) {
  console.log(configuration.rules);
  for (let rule of configuration.rules) {
    for (let pattern of rule.patterns) {
      if (isExpressionMatched(getDomain(url), pattern)) {
        return rule.name;
      }
    }
  }
  return null;
}

export function getGroupTitleByConfig(url, configuration) {
  return getGroupKeyByConfig(url, configuration);
}

function isExpressionMatched(url, expression) {
  // 转换表达式中的 * 为正则表达式中的 .*，并转义其他正则元字符
  const regexPattern = expression.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  // 构建正则表达式
  const regex = new RegExp(`^${regexPattern}$`);
  // 检查域名是否匹配表达式
  return regex.test(url);
}
