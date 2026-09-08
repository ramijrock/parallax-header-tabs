/* eslint-env jest */
/**
 * Replaces the core component mocks the React Native jest preset builds with
 * `jest/mockComponent.js`, which crashes on any component that has no
 * `prototype`. See jest/hostComponent.js.
 *
 * Each factory is written out in full because babel-plugin-jest-hoist forbids
 * a jest.mock factory from closing over anything outside itself.
 */
jest.mock('react-native/Libraries/Text/Text', () => ({
  __esModule: true,
  default: require('./jest/hostComponent')('Text'),
}));

jest.mock('react-native/Libraries/Components/View/View', () => ({
  __esModule: true,
  default: require('./jest/hostComponent')('View'),
}));

jest.mock('react-native/Libraries/Components/ScrollView/ScrollView', () => ({
  __esModule: true,
  default: require('./jest/hostComponent')('ScrollView'),
}));

// Image ships a per-platform file, so the mock has to name the resolved one.
jest.mock('react-native/Libraries/Image/Image.ios', () => ({
  __esModule: true,
  default: require('./jest/hostComponent')('Image'),
}));

// Modal needs its real semantics, not a passthrough: a hidden one renders
// nothing, and a passthrough would leave the overflow sheet in the tree
// alongside the tab strip.
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  const Modal = React.forwardRef((props, ref) =>
    props.visible === false
      ? null
      : React.createElement('Modal', { ...props, ref }, props.children)
  );
  Modal.displayName = 'Modal';
  return { __esModule: true, default: Modal };
});

jest.mock(
  'react-native/Libraries/Components/RefreshControl/RefreshControl',
  () => ({
    __esModule: true,
    default: require('./jest/hostComponent')('RefreshControl'),
  })
);
