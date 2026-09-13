import type { TSESTree } from '@typescript-eslint/utils';

export type Options = readonly [{
	drizzleObjectName: string[] | string;
}];

const isDrizzleObjName = (name: string, drizzleObjectName: string[] | string) => {
	if (typeof drizzleObjectName === 'string') {
		return name === drizzleObjectName;
	}

	if (Array.isArray(drizzleObjectName)) {
		if (drizzleObjectName.length === 0) {
			return true;
		}

		return drizzleObjectName.includes(name);
	}

	return false;
};

const isNamedProperty = (
	property: TSESTree.MemberExpression['property'],
): property is TSESTree.Identifier | TSESTree.PrivateIdentifier =>
	property.type === 'Identifier' || property.type === 'PrivateIdentifier';

export const isDrizzleObj = (
	node: TSESTree.MemberExpression,
	options: Options,
) => {
	const drizzleObjectName = options[0].drizzleObjectName;

	if (node.object.type === 'Identifier') {
		return isDrizzleObjName(node.object.name, drizzleObjectName);
	} else if (node.object.type === 'MemberExpression' && isNamedProperty(node.object.property)) {
		return isDrizzleObjName(node.object.property.name, drizzleObjectName);
	} else if (node.object.type === 'CallExpression') {
		if (node.object.callee.type === 'Identifier') {
			return isDrizzleObjName(node.object.callee.name, drizzleObjectName);
		} else if (node.object.callee.type === 'MemberExpression' && isNamedProperty(node.object.callee.property)) {
			return isDrizzleObjName(node.object.callee.property.name, drizzleObjectName);
		}
	}

	return false;
};