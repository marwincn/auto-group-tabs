import React from "react";
import ReactDOM from "react-dom";
import { IntlProvider } from "react-intl";
import en_US from "./i18n/en_US";
import zh_CN from "./i18n/zh_CN";
import ConfigPage from "./popup/ConfigPage";

const locale = chrome.i18n.getUILanguage();
const messages = {
  "zh-CN": zh_CN,
  "en-US": en_US,
};

ReactDOM.render(
  <React.StrictMode>
    <IntlProvider
      locale={locale}
      messages={messages[locale] ? messages[locale] : messages["en-US"]}
    >
      <ConfigPage />
    </IntlProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
