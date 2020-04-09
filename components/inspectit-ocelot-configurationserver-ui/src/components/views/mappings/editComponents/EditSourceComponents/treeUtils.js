/**
 * Util functions for EditSource && primereact/tree
 */
import { find, isEqual } from 'lodash';

/**
 * rootNode for tree. All other files should be added as children
 */
export const rootNode = {
  key: '/',
  label: '/',
  icon: 'pi pi-fw pi-folder',
  children: [],
};

/**
 * splits up the given node path/source to create an array of
 * all included sub paths
 *
 * e.g. if given /folder1/folder2/file.yml
 * ['/folder1', '/folder1/folder2', '/folder1/folder2/file.yml'] will be returned
 *
 * @param {string} nodePath - equals a source path in the form /folder/file.yml
 */
export const getParentKeys = (nodePath) => {
  if (nodePath === '/') {
    return ['/'];
  }

  const res = [nodePath];
  let parentKey = _getParentKey(nodePath);
  while (parentKey) {
    res.unshift(parentKey);
    parentKey = _getParentKey(parentKey);
  }

  return res;
};

/**
 * truncates the given node key to receive the key of the parent node
 * returns the parent key or null in case no parent exists
 *
 * @param {string} nodeKey - the node key/ source path of the child node
 */
const _getParentKey = (key) => {
  const parentKey = key.slice(0, key.lastIndexOf('/'));
  return !isEqual(parentKey, key) ? parentKey : null;
};

/**
 * returns true when the given first string/source(sub)
 * is a subfile of the second string/source
 *
 * @param {string} sub - string to check if it is a subfiile
 * @param {string} parent - supposed parent file of sub
 */
export const isSubfile = (sub, parent) => {
  if (sub.startsWith(parent === '/' ? parent : parent + '/')) {
    return true;
  }
  return false;
};

/**
 * Below here are function for finding and adding nodes within tree object of EditSources Component
 *
 * a tree node always contains key/label, icon is optional and children lists nested (sub)nodes
 * the functions below work for nodes where the parent key is part of the node key (/folder/file.yml is nested within /folder)
 */

/**
 * searches for an object with the specified key within an array of objects
 *
 * @param {array} rootNodes - array of objects which include at least key: string and children: array in case of nesting;
 * @param {string} nodeKey - the string/ node key which will be looked for
 */
export const findNode = (rootNodes, nodeKey) => {
  if (!rootNodes || !nodeKey) {
    return null;
  }

  const res = find(rootNodes, { key: nodeKey });
  if (res) {
    return res;
  }

  for (let i = 0; !res && i < rootNodes.length; i++) {
    if (nodeKey.startsWith(rootNodes[i].key)) {
      const childNodes = rootNodes[i].children;
      if (childNodes) {
        return findNode(childNodes, nodeKey);
      }
    }
  }
};

/**
 * triggers findNode with the 'parent key' of the given node key
 * (findNode will return null in case of not receiving a node key)
 *
 * @param {array} rootNodes - array of objects which include at least key: string and children: array in case of nesting;
 * @param {string} nodeKey - the string/ node key which will be looked for
 */
export const findParentNode = (rootNodes, nodeKey) => {
  return findNode(rootNodes, _getParentKey(nodeKey));
};

/**
 * this function tries to 'walk' down the treepath - based on path input, starting from root
 * and will add a new node whenever it cannot find the next node
 *
 * @param {object} rootNode - root node, after which the new node shall be added
 * @param {*} path - the node key path from the current tree level onwards
 */
export const addNode = (rootNode, path) => {
  // splitting path, since only the next key for the respective tree level is needed.
  const names = path.split('/').filter((str) => str !== '');

  let parent = rootNode;
  for (const name of names) {
    const childKey = `${parent.key !== '/' ? parent.key : ''}/${name}`;
    const matchingChild = find(parent.children, { key: childKey });
    if (matchingChild) {
      parent = matchingChild;
    } else {
      const newChild = _createNewNode(childKey, name);
      parent.children.push(newChild);
      parent = newChild;
    }
  }
};

/**
 * creates and returns a new node object
 *
 * @param {string} key - key of the new node
 * @param {string} label - label of the new node
 */
const _createNewNode = (key, label) => {
  return {
    key: key,
    label: label,
    icon: 'pi pi-fw pi-question-circle',
    children: [],
  };
};
