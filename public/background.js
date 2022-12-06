// 默认配置
const DEFAULT_CONFIG = {
  enableAutoGroup: true, // 是否启动自动分组
  groupTabNum: 1, // 满足多少个tab时才进行分组
  groupStrategy: 2, // 分组策略
  tabTitlePattern: "", // tab名称匹配的规则
};
// 全局的用户配置
let userConfig = DEFAULT_CONFIG;

// 根据域名分组的策略
const domainStrategy = {
  shloudGroup: (changeInfo, tab) => {
    return changeInfo.url && tab.url.match(/^https?:\/\/[^/]+\/.*/);
  },
  getGroupTitle: (tab) => {
    return getDomain(tab.url);
  },
  querySameTabs: async (tab) => {
    const domain = getDomain(tab.url);
    let tabs;
    await chrome.tabs
      .query({
        windowId: chrome.windows.WINDOW_ID_CURRENT,
        pinned: false,
      })
      .then((allTabs) => {
        tabs = allTabs.filter((t) => t.url && domain === getDomain(t.url));
      });
    return tabs;
  },
};
// 根据二级域名分组的策略
const secDomainStrategy = {
  shloudGroup: (changeInfo, tab) => {
    return changeInfo.url && tab.url.match(/^https?:\/\/[^/]+\/.*/);
  },
  getGroupTitle: (tab) => {
    return getSecDomain(tab.url);
  },
  querySameTabs: async (tab) => {
    const domain = getSecDomain(tab.url);
    let tabs;
    await chrome.tabs
      .query({
        windowId: chrome.windows.WINDOW_ID_CURRENT,
        pinned: false,
      })
      .then((allTabs) => {
        tabs = allTabs.filter((t) => t.url && domain === getSecDomain(t.url));
      });
    return tabs;
  },
};
// 根据Tab标题分组的策略
const tabTitleStrategy = {
  shloudGroup: (changeInfo, tab) => {
    return (
      changeInfo.title &&
      userConfig.tabTitlePattern &&
      tab.title.includes(userConfig.tabTitlePattern)
    );
  },
  getGroupTitle: (tab) => {
    return tab.title.includes(userConfig.tabTitlePattern)
      ? userConfig.tabTitlePattern
      : null;
  },
  querySameTabs: () => {
    const queryInfo = {
      title: `*${userConfig.tabTitlePattern}*`,
      windowId: chrome.windows.WINDOW_ID_CURRENT,
      pinned: false,
    };
    return chrome.tabs.query(queryInfo);
  },
};
// 定义分组策略
const GROUP_STRATEGY_MAP = new Map();
GROUP_STRATEGY_MAP.set(1, domainStrategy);
GROUP_STRATEGY_MAP.set(2, secDomainStrategy);
GROUP_STRATEGY_MAP.set(3, tabTitleStrategy);

// 监听tab变更事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 如果不是http协议则ungroup掉
  if (!(tab.url.startsWith("http") || tab.url.startsWith("https"))) {
    // 如果用户手动拖拽tab到group中则ungroup会抛异常
    try {
      chrome.tabs.ungroup([tabId]);
    } catch (e) {
      console.error(e);
    }
  }

  chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG), (config) => {
    userConfig = { ...DEFAULT_CONFIG, ...config };
    // 判断是否开启自动分组
    if (!userConfig.enableAutoGroup) {
      return;
    }

    const strategy = GROUP_STRATEGY_MAP.get(userConfig.groupStrategy);
    // 如果满足group的条件，进行group
    if (strategy.shloudGroup(changeInfo, tab)) {
      groupTabs(tab, strategy);
    }

    // 如果有tab从分组中移除，需要判断group的数量是否还满足数量，如果不满足ungroup
    if (changeInfo.groupId && changeInfo.groupId === -1) {
      strategy.querySameTabs(tab).then((tabs) => {
        const tabIds = tabs.map((t) => t.id);
        // 如果tab数量不满足设置最小数量进行ungroup
        if (tabs.length > 0 && tabs.length < userConfig.groupTabNum) {
          chrome.tabs.ungroup(tabIds);
        }
      });
    }
  });
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.groupRightNow) {
    chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG), (config) => {
      userConfig = { ...DEFAULT_CONFIG, ...config };
      groupAllTabs();
    });
  }
});

// 监听一键group快捷键
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case "group_right_now": {
      chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG), (config) => {
        userConfig = { ...DEFAULT_CONFIG, ...config };
        groupAllTabs();
      });
    }
  }
});

function mergeSameTabs() {
  chrome.tabs
    .query({ windowId: chrome.windows.WINDOW_ID_CURRENT })
    .then((tabs) => {
      let tabGroups = {};
      tabs.forEach((tab) => {
        let key = tab.url;
        if (key) {
          key = key.split("#")[0];
          if (!tabGroups[key]) {
            tabGroups[key] = [tab];
          } else {
            chrome.tabs.remove(tab.id);
          }
        }
      });
    });
}

function groupAllTabs() {
  chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG), (config) => {
    userConfig = { ...DEFAULT_CONFIG, ...config };
    if (userConfig.enableMerge) {
      mergeSameTabs();
    }
  });

  chrome.tabs
    .query({ windowId: chrome.windows.WINDOW_ID_CURRENT, pinned: false })
    .then((tabs) => {
      const strategy = GROUP_STRATEGY_MAP.get(userConfig.groupStrategy);
      // 按groupTitle分组，key为groupTitle，value为tabs
      let tabGroups = {};
      tabs.forEach((tab) => {
        const groupTitle = strategy.getGroupTitle(tab);
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
}

function groupTabs(tab, strategy) {
  strategy.querySameTabs(tab).then((tabs) => {
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
    const groupTitle = strategy.getGroupTitle(tab);
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

function getDomain(url) {
  const re = /^https?:\/\/([^/:]+)(:\d+)?\/.*/;
  const match = url.match(re);
  return match ? match[1] : null;
}

function getSecDomain(url) {
  const domain = getDomain(url);
  if (!domain) return null;
  // localhost地址或IP
  if (domain === "localhost" || domain.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return domain;
  }
  // 匹配二级域名
  const match = domain.match(
    /([^.]+)\.(?:(?:(?:com|net|org|edu|gov|asn|id|info|conf|oz|act|nsw|nt|qld|sa|tas|vic|wa|act\.edu|nsw\.edu|nt\.edu|qld\.edu|sa\.edu|tas\.edu|vic\.edu|wa\.edu|qld\.gov|sa\.gov|tas\.gov|vic\.gov|wa\.gov|blogspot\.com)\.au)|(?:(?:adm|adv|agr|am|arq|art|ato|b|bio|blog|bmd|cim|cng|cnt|com|coop|ecn|eco|edu|emp|eng|esp|etc|eti|far|flog|fm|fnd|fot|fst|g12|ggf|gov|imb|ind|inf|jor|jus|leg|lel|mat|med|mil|mp|mus|net|[\w\u0430-\u044f]\+\*nom|not|ntr|odo|org|ppg|pro|psc|psi|qsl|radio|rec|slg|srv|taxi|teo|tmp|trd|tur|tv|vet|vlog|wiki|zlg|blogspot\.com)\.br)|(?:(?:ac|com|edu|gov|net|org|mil|ah|bj|cq|fj|gd|gs|gz|gx|ha|hb|he|hi|hl|hn|jl|js|jx|ln|nm|nx|qh|sc|sd|sh|sn|sx|tj|xj|xz|yn|zj|hk|mo|tw|)\.cn)|(?:(?:betainabox|ar|br|cn|de|eu|gb|hu|jpn|kr|mex|no|qc|ru|sa|se|uk|us|uy|za|africa|gr|co|cloudcontrolled|cloudcontrolapp|dreamhosters|dyndns-at-home|dyndns-at-work|dyndns-blog|dyndns-free|dyndns-home|dyndns-ip|dyndns-mail|dyndns-office|dyndns-pics|dyndns-remote|dyndns-server|dyndns-web|dyndns-wiki|dyndns-work|blogdns|cechire|dnsalias|dnsdojo|doesntexist|dontexist|doomdns|dyn-o-saur|dynalias|est-a-la-maison|est-a-la-masion|est-le-patron|est-mon-blogueur|from-ak|from-al|from-ar|from-ca|from-ct|from-dc|from-de|from-fl|from-ga|from-hi|from-ia|from-id|from-il|from-in|from-ks|from-ky|from-ma|from-md|from-mi|from-mn|from-mo|from-ms|from-mt|from-nc|from-nd|from-ne|from-nh|from-nj|from-nm|from-nv|from-oh|from-ok|from-or|from-pa|from-pr|from-ri|from-sc|from-sd|from-tn|from-tx|from-ut|from-va|from-vt|from-wa|from-wi|from-wv|from-wy|getmyip|gotdns|hobby-site|homelinux|homeunix|iamallama|is-a-anarchist|is-a-blogger|is-a-bookkeeper|is-a-bulls-fan|is-a-caterer|is-a-chef|is-a-conservative|is-a-cpa|is-a-cubicle-slave|is-a-democrat|is-a-designer|is-a-doctor|is-a-financialadvisor|is-a-geek|is-a-green|is-a-guru|is-a-hard-worker|is-a-hunter|is-a-landscaper|is-a-lawyer|is-a-liberal|is-a-libertarian|is-a-llama|is-a-musician|is-a-nascarfan|is-a-nurse|is-a-painter|is-a-personaltrainer|is-a-photographer|is-a-player|is-a-republican|is-a-rockstar|is-a-socialist|is-a-student|is-a-teacher|is-a-techie|is-a-therapist|is-an-accountant|is-an-actor|is-an-actress|is-an-anarchist|is-an-artist|is-an-engineer|is-an-entertainer|is-certified|is-gone|is-into-anime|is-into-cars|is-into-cartoons|is-into-games|is-leet|is-not-certified|is-slick|is-uberleet|is-with-theband|isa-geek|isa-hockeynut|issmarterthanyou|likes-pie|likescandy|neat-url|saves-the-whales|selfip|sells-for-less|sells-for-u|servebbs|simple-url|space-to-rent|teaches-yoga|writesthisblog|firebaseapp|flynnhub|githubusercontent|ro|appspot|blogspot|codespot|googleapis|googlecode|pagespeedmobilizer|withgoogle|herokuapp|herokussl|4u|nfshost|operaunite|outsystemscloud|rhcloud|sinaapp|vipsinaapp|1kapp|hk|yolasite)\.com)|(?:(?:com|fuettertdasnetz|isteingeek|istmein|lebtimnetz|leitungsen|traeumtgerade|blogspot)\.de)|(?:(?:com|asso|nom|prd|presse|tm|aeroport|assedic|avocat|avoues|cci|chambagri|chirurgiens-dentistes|experts-comptables|geometre-expert|gouv|greta|huissier-justice|medecin|notaires|pharmacien|port|veterinaire|blogspot)\.fr)|(?:(?:org|edu|net|gov|mil|com)\.kz)|(?:(?:ae|us|dyndns|blogdns|blogsite|boldlygoingnowhere|dnsalias|dnsdojo|doesntexist|dontexist|doomdns|dvrdns|dynalias|endofinternet|endoftheinternet|from-me|game-host|go\.dyndns|gotdns|kicks-ass|misconfused|podzone|readmyblog|selfip|sellsyourhome|servebbs|serveftp|servegame|stuff-4-sale|webhop|eu|al\.eu|asso\.eu|at\.eu|au\.eu|be\.eu|bg\.eu|ca\.eu|cd\.eu|ch\.eu|cn\.eu|cy\.eu|cz\.eu|de\.eu|dk\.eu|edu\.eu|ee\.eu|es\.eu|fi\.eu|fr\.eu|gr\.eu|hr\.eu|hu\.eu|ie\.eu|il\.eu|in\.eu|int\.eu|is\.eu|it\.eu|jp\.eu|kr\.eu|lt\.eu|lu\.eu|lv\.eu|mc\.eu|me\.eu|mk\.eu|mt\.eu|my\.eu|net\.eu|ng\.eu|nl\.eu|no\.eu|nz\.eu|paris\.eu|pl\.eu|pt\.eu|q-a\.eu|ro\.eu|ru\.eu|se\.eu|si\.eu|sk\.eu|tr\.eu|uk\.eu|us\.eu|hk|za)\.org)|(?:(?:ac|com|edu|int|net|org|pp|adygeya|altai|amur|arkhangelsk|astrakhan|bashkiria|belgorod|bir|bryansk|buryatia|cbg|chel|chelyabinsk|chita|chukotka|chuvashia|dagestan|dudinka|e-burg|grozny|irkutsk|ivanovo|izhevsk|jar|joshkar-ola|kalmykia|kaluga|kamchatka|karelia|kazan|kchr|kemerovo|khabarovsk|khakassia|khv|kirov|koenig|komi|kostroma|krasnoyarsk|kuban|kurgan|kursk|lipetsk|magadan|mari|mari-el|marine|mordovia|msk|murmansk|nalchik|nnov|nov|novosibirsk|nsk|omsk|orenburg|oryol|palana|penza|perm|ptz|rnd|ryazan|sakhalin|samara|saratov|simbirsk|smolensk|spb|stavropol|stv|surgut|tambov|tatarstan|tom|tomsk|tsaritsyn|tsk|tula|tuva|tver|tyumen|udm|udmurtia|ulan-ude|vladikavkaz|vladimir|vladivostok|volgograd|vologda|voronezh|vrn|vyatka|yakutia|yamal|yaroslavl|yekaterinburg|yuzhno-sakhalinsk|amursk|baikal|cmw|fareast|jamal|kms|k-uralsk|kustanai|kuzbass|magnitka|mytis|nakhodka|nkz|norilsk|oskol|pyatigorsk|rubtsovsk|snz|syzran|vdonsk|zgrad|gov|mil|test|blogspot)\.ru)|(?:(?:com|edu|gov|in|net|org|cherkassy|cherkasy|chernigov|chernihiv|chernivtsi|chernovtsy|ck|cn|cr|crimea|cv|dn|dnepropetrovsk|dnipropetrovsk|dominic|donetsk|dp|if|ivano-frankivsk|kh|kharkiv|kharkov|kherson|khmelnitskiy|khmelnytskyi|kiev|kirovograd|km|kr|krym|ks|kv|kyiv|lg|lt|lugansk|lutsk|lv|lviv|mk|mykolaiv|nikolaev|od|odesa|odessa|pl|poltava|rivne|rovno|rv|sb|sebastopol|sevastopol|sm|sumy|te|ternopil|uz|uzhgorod|vinnica|vinnytsia|vn|volyn|yalta|zaporizhzhe|zaporizhzhia|zhitomir|zhytomyr|zp|zt|co|pp)\.ua)|(?:(?:ac|co|gov|ltd|me|net|nhs|org|plc|police|[\w\u0430-\u044f]\+\*sch|service\.gov|blogspot\.co)\.uk)|(?:(?:com|edu|gov|idv|net|org|blogspot|ltd|inc)\.hk)|(?:(?:ac|co|es|go|hs|kg|mil|ms|ne|or|pe|re|sc|busan|chungbuk|chungnam|daegu|daejeon|gangwon|gwangju|gyeongbuk|gyeonggi|gyeongnam|incheon|jeju|jeonbuk|jeonnam|seoul|ulsan|blogspot)\.kr)|(?:(?:ac|biz|co|desa|go|mil|my|net|or|sch|web)\.id)|(?:(?:com|net|org|gov|edu|ngo|mil|i)\.ph)|(?:(?:edu|gov|mil|com|net|org|idv|game|ebiz|club|blogspot)\.tw)|(?:(?:ac|ad|co|ed|go|gr|lg|ne|or|blogspot)\.jp)|(?:(?:com|net|org|edu|gov|int|ac|biz|info|name|pro|health)\.vn)|(?:(?:co|firm|net|org|gen|ind|nic|ac|edu|res|gov|mil|blogspot)\.in)|(?:(?:com|net|org|gov|edu|mil|name)\.my)|(?:(?:com|net|org|gov|edu|per|blogspot)\.sg)|(?:(?:edu|gov|riik|lib|med|com|pri|aip|org|fie)\.ee)|(?:(?:ac|co|go|in|mi|net|or)\.th)|[\w\u0430-\u044f]+)$/i
  );
  return match ? match[1] : null;
}
