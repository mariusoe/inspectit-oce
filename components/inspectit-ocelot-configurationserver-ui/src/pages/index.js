import React from 'react';
import Router from 'next/router';
import { linkPrefix } from '../lib/configuration';

/**
 * The index page. This page will redirect the user to the login page or to the applications "home" page.
 */
class IndexPage extends React.Component {
  componentDidMount() {
    Router.push(linkPrefix + '/configuration');
  }

  render() {
    return <div />;
  }
}

export default IndexPage;
