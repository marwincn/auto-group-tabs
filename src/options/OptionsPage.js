import React from "react";
import { injectIntl } from "react-intl";
import PropTypes from "prop-types";
import {
  Flex,
  Divider,
  Card,
  Button,
  Select,
  Typography,
  Modal,
  Form,
  Input,
} from "antd";
import { EditOutlined, DeleteOutlined, CloseOutlined } from "@ant-design/icons";
import "./OptionsPage.css";

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 20 },
  },
};

const formItemLayoutWithOutLabel = {
  wrapperCol: {
    xs: { span: 24, offset: 0 },
    sm: { span: 20, offset: 4 },
  },
};

class OptionsPage extends React.Component {
  static propTypes = {
    intl: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.i18n = (key) => props.intl.formatMessage({ id: key });
    this.state = {
      configuration: {
        rules: [],
        fallback: 0,
      },
      isCreateModalOpen: false,
      isModifyModalOpen: false,
    };
  }

  componentDidMount() {
    // return chrome.storage.sync.get(Object.keys(this.state), (config) => {
    //   this.setState(config);
    // });
  }

  setIsCreateModalOpen(isOpen) {
    this.setState({ isCreateModalOpen: isOpen });
  }

  handleCreateOk() {}

  setIsModifyModalOpen(isOpen) {
    this.setState({ isModifyModalOpen: isOpen });
  }

  handleModifyOk() {}

  render() {
    return (
      <div className="configPage">
        <Flex
          gap="small"
          vertical
          style={{ marginLeft: "10px", marginRight: "10px" }}
        >
          <Typography.Title>分组规则</Typography.Title>
          <Divider style={{ marginTop: "0" }} />
          <Button
            type="primary"
            onClick={() => this.setIsCreateModalOpen(true)}
          >
            新增自定义规则
          </Button>
          <Typography.Title level={5}>自定义规则：</Typography.Title>
          <Card
            title="分组名称: test"
            size="small"
            hoverable
            style={{
              width: "100%",
            }}
            actions={[
              <EditOutlined key="编辑" />,
              <DeleteOutlined key="删除" />,
            ]}
          >
            <p className="patternName">www.google.com</p>
            <p className="patternName">www.baidu.com</p>
          </Card>

          <Typography.Title level={5}>未匹配到自定义规则时：</Typography.Title>
          <Select
            defaultValue="0"
            style={{ width: "100%" }}
            onChange={() => {}}
            options={[
              { value: "0", label: "不分组" },
              { value: "1", label: "按域名分组" },
              { value: "2", label: "按二级域名分组" },
            ]}
          />
        </Flex>

        <Modal
          title="新增自定义规则"
          open={this.state.isCreateModalOpen}
          onOk={this.handleCreateOk}
          onCancel={() => {
            this.setIsCreateModalOpen(false);
          }}
        >
          <Form
            name="basic"
            onFinish={() => {}}
            onFinishFailed={() => {}}
            autoComplete="off"
          >
            <Form.Item label="分组名称" name="groupName" required>
              <Input />
            </Form.Item>
            <Form.List name={"patterns"}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Form.Item
                    {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
                    label={index === 0 ? '匹配规则' : ''}
                    required
                    key={field.key}
                    >
                      <Form.Item name={[field.name]}>
                        <Input placeholder="pattern" />
                      </Form.Item>
                      {fields.length > 1 ? (
                        <CloseOutlined
                          onClick={() => {
                            remove(field.name);
                          }}
                        />
                      ) : null}
                  </Form.Item>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>
                    + 添加规则
                  </Button>
                </>
              )}
            </Form.List>
          </Form>
        </Modal>
        <Modal
          title="修改自定义规则"
          open={this.state.isModifyModalOpen}
          onOk={this.handleModifyOk}
          onCancel={() => {
            this.setIsModifyModalOpen(false);
          }}
        >
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </Modal>
      </div>
    );
  }
}

export default injectIntl(OptionsPage);
