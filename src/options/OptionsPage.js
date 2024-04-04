import React from "react";
import { injectIntl } from "react-intl";
import PropTypes from "prop-types";

class OptionsPage extends React.Component {
  static propTypes = {
    intl: PropTypes.object,
  };

  render() {
    return (
      <div className="mainPanel">hello
      </div>
    );
  }
}

export default injectIntl(OptionsPage);
