import _ from 'lodash';
import React, {
    ReactElement
} from 'react';
import makeConfiguration from './makeConfiguration';
import isIterable from './isIterable';
import parseStyleName from './parseStyleName';
import generateAppendClassName from './generateAppendClassName';
import objectUnfreeze from 'object-unfreeze';

const linkElement = (element: ReactElement, styles: Object, configuration: Object, theme: String = ""): ReactElement => {
    let appendClassName,
        elementIsFrozen,
        elementShallowCopy;

    elementShallowCopy = element;

    if (Object.isFrozen && Object.isFrozen(elementShallowCopy)) {
        elementIsFrozen = true;

        // https://github.com/facebook/react/blob/v0.13.3/src/classic/element/ReactElement.js#L131
        elementShallowCopy = objectUnfreeze(elementShallowCopy);
        elementShallowCopy.props = objectUnfreeze(elementShallowCopy.props);
    }

    const styleNames = parseStyleName(elementShallowCopy.props.styleName || '', configuration.allowMultiple);

    if (React.isValidElement(elementShallowCopy.props.children)) {
        elementShallowCopy.props.children = linkElement(React.Children.only(elementShallowCopy.props.children), styles, configuration,theme);
    } else if (_.isArray(elementShallowCopy.props.children) || isIterable(elementShallowCopy.props.children)) {
        elementShallowCopy.props.children = React.Children.map(elementShallowCopy.props.children, (node) => {
            if (React.isValidElement(node)) {
                return linkElement(node, styles, configuration, theme);
            } else {
                return node;
            }
        });
    }

    if (styleNames.length) {
        appendClassName = generateAppendClassName(styles, styleNames, configuration.errorWhenNotFound, theme);

        if (appendClassName) {
            if (elementShallowCopy.props.className) {
                appendClassName = elementShallowCopy.props.className + ' ' + appendClassName;
            }

            elementShallowCopy.props.className = appendClassName;
            elementShallowCopy.props.styleName = null;
        }
    }

    if (elementIsFrozen) {
        Object.freeze(elementShallowCopy.props);
        Object.freeze(elementShallowCopy);
    }

    return elementShallowCopy;
};

/**
 * @param {ReactElement} element
 * @param {Object} styles CSS modules class map.
 * @param {CSSModules~Options} userConfiguration
 * @param {String} theme Theme
 */
export default (element: ReactElement, styles = {}, userConfiguration, theme: String = ""): ReactElement => {
    // @see https://github.com/gajus/react-css-modules/pull/30
    if (!_.isObject(element)) {
        return element;
    }

    const configuration = makeConfiguration(userConfiguration);

    return linkElement(element, styles, configuration,theme);
};
