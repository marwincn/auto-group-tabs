import React from "react";
import { Form, Switch, Radio, InputNumber, Button, Input } from "antd";
import { InboxOutlined } from '@ant-design/icons';
import "antd/dist/antd.css";

const groupStrategyOptions = [
  {label: 'Domain', value: 1},
  {label: 'Tab Name', value: 2},
];

class ConfigPage extends React.Component {
  constructor() {
    super();
    this.state = {
      enableAutoGroup: true,
      groupStrategy: 1,
      groupTabNum: 2,
      showGroupName: true,
      tabNamePattern: "",
      applyLoading: false,
    };
  };

  componentDidMount() {
    return chrome.storage.local.get(Object.keys(this.state), config => {
      this.setState(config);
    });
  };

  onManuallyUpdateClick = () => {

  };

  onEnableAutoGroupChange = value => {
    const newState = {enableAutoGroup: value};
    this.setState(newState);
    chrome.storage.local.set(newState);
  };

  onGroupTabNumChange = value => {
    const newState = {groupTabNum: value};
    this.setState(newState);
    chrome.storage.local.set(newState);
  };

  onGroupStrategyChange = e => {
    const newState = {groupStrategy: e.target.value};
    this.setState(newState);
    chrome.storage.local.set(newState);
  };

  onTabNamePatternApply = value => {
    this.setState({applyLoading: true, tabNamePattern: value});
    chrome.storage.local.set({tabNamePattern: value}, () => {
      setInterval(() => {
        this.setState({applyLoading: false});
      }, 500);
    });
  }

  onShowGroupNameChange = value => {
    const newState = {showGroupName: value};
    this.setState(newState);
    chrome.storage.local.set(newState);
  }

  render() {
    return (
      <div>
        <Form layout="vertical" style={{padding: "20px"}}>
          <Form.Item style={{textAlign: "center"}}>
            <Button type="primary" shape="round" icon={<InboxOutlined />} onClick={this.onManuallyUpdateClick}>
              Group all tabs right now!
            </Button>
          </Form.Item>
          <Form.Item label="Enable auto group tabs">
            <Switch checked={this.state.enableAutoGroup} onChange={this.onEnableAutoGroupChange} />
          </Form.Item>
          <Form.Item label="Minimum number of tabs per group">
            <InputNumber min={2} value={this.state.groupTabNum} onChange={this.onGroupTabNumChange} />
          </Form.Item>
          <Form.Item label="Group strategy">
            <Radio.Group
              options={groupStrategyOptions}
              value={this.state.groupStrategy}
              onChange={this.onGroupStrategyChange}
              optionType="button"
            />
          </Form.Item>
          { this.state.groupStrategy === 1 ? (
              <Form.Item label="Show group name">
                <Switch checked={this.state.showGroupName} onChange={this.onShowGroupNameChange} />
              </Form.Item>
            ) : (
              <Form.Item label="Tab name pattern">
                <Input.Search
                  style={{ width: '250px' }}
                  placeholder="input a regex pattern"
                  enterButton="Apply"
                  defaultValue={this.state.tabNamePattern}
                  loading={this.state.applyLoading}
                  onSearch={this.onTabNamePatternApply}
                />
              </Form.Item>
            )
          }
        </Form>
      </div>
    );
  }
}

export default ConfigPage;
