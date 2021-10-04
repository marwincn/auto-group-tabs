import React from "react";
import { Form, Switch, Radio, InputNumber, Input } from "antd";
// import { InboxOutlined } from '@ant-design/icons';
import "antd/dist/antd.css";

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
      groupTabNum: 2,
      tabTitlePattern: "",
      applyLoading: false,
    };
  }

  componentDidMount() {
    return chrome.storage.local.get(Object.keys(this.state), config => {
      console.log("config", config);
      this.setState(config);
    });
  }

  onManuallyUpdateClick = () => {

  };

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
      <div style={{ width: "580px", height: "255px", overflow: "auto" }}>
        <Form
          labelCol={{ span: 10 }}
          wrapperCol={{ span: 14 }}
          labelAlign="left"
          layout="horizontal"
          style={{ padding: "15px" }}
        >
          {/* <Form.Item style={{textAlign: "center"}}>
            <Button type="primary" shape="round" icon={<InboxOutlined />} onClick={this.onManuallyUpdateClick}>
              Group all tabs right now!
            </Button>
          </Form.Item> */}
          <Form.Item label="Enable auto group tabs">
            <Switch checked={this.state.enableAutoGroup} onChange={this.onEnableAutoGroupChange} />
          </Form.Item>
          <Form.Item label="Min-number of tabs per group">
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
