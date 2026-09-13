import { type } from 'arktype';
import { numeric, pgTable } from 'drizzle-orm/pg-core';
import { test } from 'vitest';
import { createSelectSchema } from '../src';
import { expectSchemaShape } from './utils.ts';

test('numeric bigint does not inherit int64 bounds', (t) => {
	const table = pgTable('test', {
		value: numeric({ mode: 'bigint', precision: 78, scale: 0 }).notNull(),
	});

	const result = createSelectSchema(table);
	const expected = type({ value: type.bigint });

	expectSchemaShape(t, expected).from(result);
});
