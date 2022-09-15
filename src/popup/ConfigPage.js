import {
  Button,
  Divider,
  Form,
  InputNumber,
  Radio,
  Switch,
  Alert,
} from "antd";
import "antd/dist/antd.css";
import React from "react";
import "./ConfigPags.css";
import { injectIntl } from "react-intl";
import PropTypes from "prop-types";
import TextArea from "antd/lib/input/TextArea";

class ConfigPage extends React.Component {
  static propTypes = {
    intl: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.i18n = (key) => props.intl.formatMessage({ id: key });
    this.state = {
      enableAutoGroup: true,
      enableMerge: true,
      groupStrategy: 2,
      groupTabNum: 1,
      tabTitlePattern: "",
      applyLoading: false,
      groupNameConfig: {},
    };
  }

  componentDidMount() {
    return chrome.storage.sync.get(Object.keys(this.state), (config) => {
      this.setState(config);
    });
  }

  onManuallyUpdateClick = () => {
    chrome.runtime.sendMessage({ groupRightNow: true });
  };

  onEnableAutoGroupChange = (value) => {
    const newState = { enableAutoGroup: value };
    this.setState(newState);
    chrome.storage.sync.set(newState);
  };
  onEnableMerge = (value) => {
    const newState = {
      enableMerge: value,
    };
    this.setState(newState);
    chrome.storage.sync.set(newState);
  };

  onGroupTabNumChange = (value) => {
    const newState = { groupTabNum: value };
    this.setState(newState);
    chrome.storage.sync.set(newState);
  };

  onGroupNameConfigChange= (value)=> {
    const newState = { groupNameConfig: value.target.value }
    this.setState(newState);
    chrome.storage.sync.set(newState);
  }

  onGroupStrategyChange = (e) => {
    const newState = { groupStrategy: e.target.value };
    this.setState(newState);
    chrome.storage.sync.set(newState);
  };

  onTabTitlePatternApply = (value) => {
    console.log(value);
    this.setState({ applyLoading: true });
    chrome.storage.sync.set({ tabTitlePattern: value }, () => {
      setInterval(() => {
        this.setState({ applyLoading: false });
      }, 500);
    });
  };

  onTabTitlePatternChange = (e) => {
    this.setState({ tabTitlePattern: e.target.value });
  };

  render() {
    const groupStrategyOptions = [
      { label: this.i18n("domain"), value: 1 },
      { label: this.i18n("sld"), value: 2 },
    ];

    return (
      <div style={{ width: "280px", height: "455px", overflow: "auto" }}>
        <Form labelAlign="left" layout="vertical" style={{ padding: "16px" }}>
          <Form.Item style={{ textAlign: "center" }}>
            <Button
              type="primary"
              shape="round"
              onClick={this.onManuallyUpdateClick}
            >
              👏 {this.i18n("group_all_tabs")}
            </Button>
          </Form.Item>

          <Divider style={{ margin: "12px 0" }} />

          <Form.Item label={this.i18n("enable_auto_group")}>
            <Switch
              checked={this.state.enableAutoGroup}
              onChange={this.onEnableAutoGroupChange}
            />
          </Form.Item>
          <Form.Item
            tooltip={this.i18n("merge_tip")}
            label={this.i18n("enable_merge")}
          >
            <Switch
              checked={this.state.enableMerge}
              onChange={this.onEnableMerge}
            />
          </Form.Item>
          <Form.Item label={this.i18n("min_number")}>
            <InputNumber
              min={1}
              value={this.state.groupTabNum}
              onChange={this.onGroupTabNumChange}
            />
          </Form.Item>

          <Divider style={{ margin: "12px 0" }} />

          <Form.Item label={this.i18n("group_strategy")}>
            <Radio.Group
              options={groupStrategyOptions}
              value={this.state.groupStrategy}
              onChange={this.onGroupStrategyChange}
              optionType="button"
            />
          </Form.Item>
          {this.state.groupStrategy === 1 && (
            <Alert message={this.i18n("domain_tip")} type="info" />
          )}
          {this.state.groupStrategy === 2 && (
            <Alert message={this.i18n("sld_tip")} type="info" />
          )}

          <Divider style={{ margin: "12px 0" }}  />

          <Form.Item label='基于正则对标题或URL分类'>
            <TextArea
                placeholder={'json格式，例如 {\n  "*.google.*/maps" : "group-1",\n  "*.google.com" : "group-2"\n}\n将按照从上到下的优先级进行标签归类'}
                autoSize={{ minRows: 4, maxRows: 50 }}
                value={this.state.groupNameConfig}
                onChange={this.onGroupNameConfigChange}/>
          </Form.Item>

        </Form>
      </div>
    );
  }
}

export default injectIntl(ConfigPage);
