import React from "react";
import { Form, Switch, Radio, InputNumber, Input, Button, Divider } from "antd";
import "antd/dist/antd.css";
import "./ConfigPags.css";

const groupStrategyOptions = [
  { label: 'Domain', value: 1 },
  { label: 'Tab Title', value: 2 },
];

class ConfigPage extends React.Component {
  constructor() {
    super();
    this.state = {
      enableAutoGroup: true,
      groupStrategy: 1,
      groupTabNum: 1,
      tabTitlePattern: "",
      applyLoading: false,
    };
  }

  componentDidMount() {
    return chrome.storage.local.get(Object.keys(this.state), config => {
      this.setState(config);
    });
  }

  onManuallyUpdateClick = () => {
    chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT }).then(tabs => {
      let tabGroups = {};
      tabs.forEach(tab => {
        const groupTitle = this.getGroupName(tab);
        if (groupTitle) {
          if (!tabGroups[groupTitle]) {
            tabGroups[groupTitle] = [];
          }
          tabGroups[groupTitle].push(tab);
        }
      });

      for (const groupTitle in tabGroups) {
        if (tabGroups[groupTitle].length >= this.state.groupTabNum) {
          const tabIds = tabGroups[groupTitle].map(tab => tab.id);
          chrome.tabs.group({ tabIds }).then(groupId => {
            chrome.tabGroups.update(groupId, { title: groupTitle });
        });
        }
      }
    });
  };

  getGroupName = tab => {
    switch (this.state.groupStrategy) {
      case 1: {
        const re = /^https?:\/\/([^/]+)\/.*/;
        const match = tab.url.match(re);
        if (!match) {
          return "";
        }
        return match[1];
      }
      case 2: {
        return this.state.tabTitlePattern;
      }
      default: {
        return "";
      }
    }
  }

  onEnableAutoGroupChange = value => {
    const newState = { enableAutoGroup: value };
    this.setState(newState);
    chrome.storage.local.set(newState);
  };

  onGroupTabNumChange = value => {
    const newState = { groupTabNum: value };
    this.setState(newState);
    chrome.storage.local.set(newState);
  };

  onGroupStrategyChange = e => {
    const newState = { groupStrategy: e.target.value };
    this.setState(newState);
    chrome.storage.local.set(newState);
  };

  onTabTitlePatternApply = value => {
    console.log(value);
    this.setState({ applyLoading: true });
    chrome.storage.local.set({ tabTitlePattern: value }, () => {
      setInterval(() => {
        this.setState({ applyLoading: false });
      }, 500);
    });
  }

  onTabTitlePatternChange = e => {
    this.setState({ tabTitlePattern: e.target.value });
  }

  render() {
    return (
      <div style={{ width: "300px", height: "420px", overflow: "auto" }}>
        <Form
          // labelCol={{ span: 10 }}
          // wrapperCol={{ span: 14 }}
          labelAlign="left"
          layout="vertical"
          style={{ padding: "16px" }}
        >
          <Form.Item style={{textAlign: "center"}}>
            <Button type="primary" shape="round"  onClick={this.onManuallyUpdateClick}>
              👏  Group all tabs right now!
            </Button>
          </Form.Item>
          <Divider />
          <Form.Item label="Enable auto group tabs">
            <Switch checked={this.state.enableAutoGroup} onChange={this.onEnableAutoGroupChange} />
          </Form.Item>
          <Form.Item label="Min-number of tabs per group">
            <InputNumber min={1} value={this.state.groupTabNum} onChange={this.onGroupTabNumChange} />
          </Form.Item>
          <Form.Item label="Group strategy">
            <Radio.Group
              options={groupStrategyOptions}
              value={this.state.groupStrategy}
              onChange={this.onGroupStrategyChange}
              optionType="button"
            />
          </Form.Item>
          <Form.Item label="Tab title contains">
            <Input.Search
              style={{ width: '250px' }}
              enterButton="Apply"
              placeholder="Empty matches nothing"
              value={this.state.tabTitlePattern}
              onChange={this.onTabTitlePatternChange}
              loading={this.state.applyLoading}
              disabled={this.state.groupStrategy !== 2}
              onSearch={this.onTabTitlePatternApply}
            />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

export default ConfigPage;
