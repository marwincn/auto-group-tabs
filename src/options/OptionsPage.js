import React from "react";
import { injectIntl } from "react-intl";
import PropTypes from "prop-types";
import {
  Flex,
  Divider,
  Button,
  Select,
  Typography,
  Form,
  Input,
  Space,
  Card,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import "./OptionsPage.css";

class OptionsPage extends React.Component {
  static propTypes = {
    intl: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.i18n = (key) => props.intl.formatMessage({ id: key });
    this.form = React.createRef();
    this.state = {
      isEditting: false,
      isCreateModalOpen: false,
      isModifyModalOpen: false,
    };
  }

  componentDidMount = () => {
    chrome.storage.sync.get(["configuration"], (data) => {
      this.form.current.setFieldsValue(data.configuration);
    });
  };

  editOrSaveButtomOnClick = () => {
    if (!this.state.isEditting) {
      // 让表单变成编辑态
      this.setState({ isEditting: true });
      return;
    }

    const configuration = this.form.current.getFieldsValue();
    console.log(configuration);
    // 检查表单，然后保存配置信息，设置编辑状态为false
    this.form.current
      .validateFields({ recursive: true })
      .then(() => {
        chrome.storage.sync.set({ configuration: configuration }, () => {
          this.setState({ isEditting: false });
        });
      })
      .catch(() => { });
  };

  render() {
    return (
      <div className="configPage">
        <Flex
          gap="small"
          vertical
          style={{ marginTop: "50px", marginLeft: "10px", marginRight: "10px" }}
        >
          <Flex align="flex-end" justify="space-between">
            <Typography.Title style={{ margin: 0 }}>
              {this.i18n("config_page_title")}
            </Typography.Title>
            <Button
              type={this.state.isEditting ? "default" : "primary"}
              style={
                this.state.isEditting
                  ? {
                    background: "#76EE00",
                    borderColor: "#76EE00",
                    color: "#ffffff",
                  }
                  : null
              }
              onClick={this.editOrSaveButtomOnClick}
            >
              {this.state.isEditting ? this.i18n("save") : this.i18n("edit")}
            </Button>
          </Flex>
          <Divider style={{ marginBottom: 0 }} />
          <Form
            name="userConfiguration"
            ref={this.form}
            disabled={!this.state.isEditting}
            autoComplete="false"
          >
            <Typography.Title level={5}>
              {this.i18n("config_title_fallback")}
            </Typography.Title>
            <Form.Item name="fallback" initialValue="none">
              <Select
                style={{ width: "100%" }}
                onChange={() => { }}
                options={[
                  { value: "none", label: this.i18n("option_none") },
                  { value: "domain", label: this.i18n("option_domain") },
                  { value: "sld", label: this.i18n("option_sld") },
                ]}
              />
            </Form.Item>
            <Typography.Title level={5}>
              {this.i18n("config_title_custom_rule")}
            </Typography.Title>
            <Form.List name="rules">
              {(rules, { add, remove }) => (
                <Space
                  direction="vertical"
                  size="small"
                  style={{ display: "flex" }}
                >
                  {rules.map((rule) => (
                    <Card
                      size="small"
                      key={rule.key}
                      hoverable
                      style={{ border: "1px solid #B5B5B5" }}
                      extra={
                        <DeleteOutlined
                          onClick={() => {
                            if (this.state.isEditting) {
                              remove(rule.name);
                            }
                          }}
                        />
                      }
                    >
                      <Form.Item
                        labelCol={{
                          span: 6,
                        }}
                        wrapperCol={{
                          span: 18,
                        }}
                        labelAlign="left"
                        label={this.i18n("group_name")}
                        name={[rule.name, "name"]}
                        rules={[
                          {
                            required: true,
                            message: this.i18n("group_name_validate_message"),
                          },
                        ]}
                      >
                        <Input placeholder="Google" />
                      </Form.Item>
                      <Form.Item
                        labelCol={{
                          span: 6,
                        }}
                        wrapperCol={{
                          span: 18,
                        }}
                        labelAlign="left"
                        label={this.i18n("group_color")}
                        name={[rule.name, "color"]}
                        initialValue="grey"
                      >
                        <Select
                          style={{ width: "100%" }}
                          options={[
                            {
                              value: "grey",
                              label: (
                                <span>
                                  <span style={{
                                    display: "inline-block",
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    backgroundColor: "#5F6368",
                                    marginRight: "8px",
                                    verticalAlign: "middle"
                                  }}></span>
                                  {this.i18n("color_grey")}
                                </span>
                              )
                            },
                            {
                              value: "blue",
                              label: (
                                <span>
                                  <span style={{
                                    display: "inline-block",
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    backgroundColor: "#1A73E8",
                                    marginRight: "8px",
                                    verticalAlign: "middle"
                                  }}></span>
                                  {this.i18n("color_blue")}
                                </span>
                              )
                            },
                            {
                              value: "red",
                              label: (
                                <span>
                                  <span style={{
                                    display: "inline-block",
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    backgroundColor: "#D93025",
                                    marginRight: "8px",
                                    verticalAlign: "middle"
                                  }}></span>
                                  {this.i18n("color_red")}
                                </span>
                              )
                            },
                            {
                              value: "yellow",
                              label: (
                                <span>
                                  <span style={{
                                    display: "inline-block",
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    backgroundColor: "#F9AB00",
                                    marginRight: "8px",
                                    verticalAlign: "middle"
                                  }}></span>
                                  {this.i18n("color_yellow")}
                                </span>
                              )
                            },
                            {
                              value: "green",
                              label: (
                                <span>
                                  <span style={{
                                    display: "inline-block",
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    backgroundColor: "#1E8E3E",
                                    marginRight: "8px",
                                    verticalAlign: "middle"
                                  }}></span>
                                  {this.i18n("color_green")}
                                </span>
                              )
                            },
                            {
                              value: "pink",
                              label: (
                                <span>
                                  <span style={{
                                    display: "inline-block",
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    backgroundColor: "#D01884",
                                    marginRight: "8px",
                                    verticalAlign: "middle"
                                  }}></span>
                                  {this.i18n("color_pink")}
                                </span>
                              )
                            },
                            {
                              value: "purple",
                              label: (
                                <span>
                                  <span style={{
                                    display: "inline-block",
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    backgroundColor: "#8E24AA",
                                    marginRight: "8px",
                                    verticalAlign: "middle"
                                  }}></span>
                                  {this.i18n("color_purple")}
                                </span>
                              )
                            },
                            {
                              value: "cyan",
                              label: (
                                <span>
                                  <span style={{
                                    display: "inline-block",
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    backgroundColor: "#00ACC1",
                                    marginRight: "8px",
                                    verticalAlign: "middle"
                                  }}></span>
                                  {this.i18n("color_cyan")}
                                </span>
                              )
                            },
                            {
                              value: "orange",
                              label: (
                                <span>
                                  <span style={{
                                    display: "inline-block",
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    backgroundColor: "#E8710A",
                                    marginRight: "8px",
                                    verticalAlign: "middle"
                                  }}></span>
                                  {this.i18n("color_orange")}
                                </span>
                              )
                            },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item
                        label={this.i18n("patterns")}
                        labelCol={{
                          span: 6,
                        }}
                        wrapperCol={{
                          span: 18,
                        }}
                        labelAlign="left"
                        required
                        tooltip={{
                          title: this.i18n("tooltip_of_pattern"),
                          color: "blue",
                        }}
                      >
                        <Form.List
                          name={[rule.name, "patterns"]}
                          initialValue={[{ pattern: undefined, matchType: "domain" }]}
                        >
                          {(patterns, patternOp) => (
                            <Space
                              direction="vertical"
                              size="small"
                              style={{ display: "flex" }}
                            >
                              {patterns.map((pattern) => (
                                <div
                                  key={pattern.key}
                                  style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}
                                >
                                  <Form.Item
                                    noStyle
                                    name={[pattern.name, "matchType"]}
                                    initialValue="domain"
                                  >
                                    <Select 
                                      style={{ width: "140px" }}
                                      options={[
                                        { 
                                          value: "domain", 
                                          label: this.i18n("match_type_domain") 
                                        },
                                        { 
                                          value: "url", 
                                          label: this.i18n("match_type_url") 
                                        },
                                      ]}
                                    />
                                  </Form.Item>
                                  <Form.Item
                                    noStyle
                                    name={[pattern.name, "pattern"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: this.i18n(
                                          "pattern_validate_message"
                                        ),
                                      },
                                    ]}
                                    style={{ flex: 1, minWidth: 0 }}
                                  >
                                    <Input placeholder="*.google.com" style={{ width: "100%" }} />
                                  </Form.Item>
                                  {patterns.length > 1 ? (
                                    <DeleteOutlined
                                      style={{ margin: "8px", marginTop: "4px", cursor: "pointer" }}
                                      onClick={() => {
                                        if (this.state.isEditting) {
                                          patternOp.remove(pattern.name);
                                        }
                                      }}
                                    />
                                  ) : null}
                                </div>
                              ))}
                              <Button
                                type="dashed"
                                onClick={() => patternOp.add()}
                                block
                              >
                                + {this.i18n("add_pattern")}
                              </Button>
                            </Space>
                          )}
                        </Form.List>
                      </Form.Item>
                    </Card>
                  ))}

                  <Button type="dashed" onClick={() => add()} block>
                    + {this.i18n("add_rule")}
                  </Button>
                </Space>
              )}
            </Form.List>
          </Form>
        </Flex>
      </div>
    );
  }
}

export default injectIntl(OptionsPage);
