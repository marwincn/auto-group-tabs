import { getDomain } from "./utils.js";

export const defaultConfiguration = {
  rules: new Map([["google", ["*.google.com", "*.baidu.com"]]]),
  fallback: 0,
};

export function getGroupKeyByConfig(url, configuration) {
  console.log(configuration.rules);
  for (let key of configuration.rules.keys()) {
    const list = configuration.rules.get(key);
    console.log(key);
    console.log(list);
    for (let expression of list) {
      if (isExpressionMatched(getDomain(url), expression)) {
        return key;
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
