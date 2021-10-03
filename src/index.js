import React from 'react';
import ReactDOM from 'react-dom';
import App from './popup/App';

console.log("render");
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
