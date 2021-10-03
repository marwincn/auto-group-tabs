import React from "react";
import { getAllConfig, setConfig } from "../chrome/config";
import { Form, Switch, Radio, InputNumber, Button, Input } from "antd";
import { InboxOutlined } from '@ant-design/icons';
import "antd/dist/antd.css";

const groupStrategyOptions = [
  {label: 'Domain', value: 1},
  {label: 'Tab Name', value: 2},
];

class App extends React.Component {
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
    // getAllConfig().then(config => {
    //   this.setState(config);
    // });
  };

  onManuallyUpdateClick = () => {

  };

  onEnableAutoGroupChange = value => {
    const newState = {enableAutoGroup: value};
    this.setState(newState);
    // setConfig(newState);
  };

  onGroupTabNumChange = value => {
    const newState = {groupTabNum: value};
    this.setState(newState);
    // setConfig(newState);
  };

  onGroupStrategyChange = e => {
    const newState = {groupStrategy: e.target.value};
    this.setState(newState);
    // setConfig(newState);
  };

  onTabNamePatternApply = value => {
    this.setState({applyLoading: true});
    // setConfig({tabNamePattern: value}).then(() => {
    //   setInterval(() => {
    //     this.setState({applyLoading: false});
    //   }, 500);
    // });
  }

  onShowGroupNameChange = value => {
    const newState = {showGroupName: value};
    this.setState(newState);
    // setConfig(newState);
  }

  render() {
    return (
      <div>
        <Form layout="vertical" style={{padding: "20px"}}>
          <Form.Item style={{width: "250px", textAlign: "center"}}>
            <Button type="primary" shape="round" icon={<InboxOutlined />} onClick={this.onManuallyUpdateClick}>
              Update all tabs right now!
            </Button>
          </Form.Item>
          <Form.Item label="Enable auto group tabs">
            <Switch checked={this.state.enableAutoGroup} onChange={this.onEnableAutoGroupChange} />
          </Form.Item>
          <Form.Item label="Minimum number of tabs per group">
            <InputNumber min={2} defaultValue={this.state.groupTabNum} onChange={this.onGroupTabNumChange} />
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

export default App;
