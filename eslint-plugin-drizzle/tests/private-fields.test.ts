// @ts-ignore
import { RuleTester } from '@typescript-eslint/rule-tester';

import deleteRule from '../src/enforce-delete-with-where';
import updateRule from '../src/enforce-update-with-where';

const parserResolver = require.resolve('@typescript-eslint/parser');

const ruleTester = new RuleTester({
	parser: parserResolver,
	parserOptions: { ecmaVersion: 2022 },
});

ruleTester.run('enforce delete with where (private field)', deleteRule, {
	valid: [{
		code: 'class Repo { #other; clear() { return this.#other.delete(users); } }',
		options: [{ drizzleObjectName: 'db' }],
	}],
	invalid: [{
		code: 'class Repo { #db; clear() { return this.#db.delete(users); } }',
		options: [{ drizzleObjectName: 'db' }],
		errors: [{
			messageId: 'enforceDeleteWithWhere',
			data: { drizzleObjName: 'this.#db' },
		}],
	}],
});

ruleTester.run('enforce update with where (private field)', updateRule, {
	valid: [{
		code: 'class Repo { #other; save() { return this.#other.update(users).set({ name: "safe" }); } }',
		options: [{ drizzleObjectName: 'db' }],
	}],
	invalid: [{
		code: 'class Repo { #db; save() { return this.#db.update(users).set({ name: "unsafe" }); } }',
		options: [{ drizzleObjectName: 'db' }],
		errors: [{
			messageId: 'enforceUpdateWithWhere',
			data: { drizzleObjName: 'this.#db' },
		}],
	}],
});
