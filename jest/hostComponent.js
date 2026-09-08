/**
 * React Native 0.83's jest preset builds its component mocks by subclassing
 * the real component (`jest/mockComponent.js`), which reads
 * `RealComponent.prototype.constructor`. Several core components are plain
 * function components now and have no `prototype`, so that read throws before
 * a single test renders.
 *
 * These stand-ins render a host element of the same name, which is all the
 * queries in @testing-library/react-native need. Drop this once the preset
 * guards that access.
 */
const React = require('react');

module.exports = function hostComponent(name) {
  const Component = React.forwardRef((props, ref) =>
    React.createElement(name, { ...props, ref }, props.children)
  );
  Component.displayName = name;
  return Component;
};
