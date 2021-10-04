import React from 'react';
import ReactDOM from 'react-dom';
import ConfigPage from './popup/ConfigPage';

console.log("render");
ReactDOM.render(
  <React.StrictMode>
    <ConfigPage />
  </React.StrictMode>,
  document.getElementById('root')
);
