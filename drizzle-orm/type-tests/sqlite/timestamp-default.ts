import { sql } from '~/sql/sql.ts';
import { integer, sqliteTable } from '~/sqlite-core/index.ts';

sqliteTable('timestamp_defaults', {
	secondsSql: integer('seconds_sql', { mode: 'timestamp' }).default(sql`(unixepoch())`),
	millisecondsSql: integer('milliseconds_sql', { mode: 'timestamp_ms' }).default(
		sql`(cast((julianday('now') - 2440587.5) * 86400000 as integer))`,
	),
	secondsRuntime: integer('seconds_runtime', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	millisecondsRuntime: integer('milliseconds_runtime', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),

	// SQLite DDL cannot serialize a JavaScript Date literal as a column default.
	// @ts-expect-error - use a SQL expression for DDL defaults or $defaultFn for runtime dates
	invalidSecondsDate: integer('invalid_seconds_date', { mode: 'timestamp' }).default(new Date()),
	// @ts-expect-error - use a SQL expression for DDL defaults or $defaultFn for runtime dates
	invalidMillisecondsDate: integer('invalid_milliseconds_date', { mode: 'timestamp_ms' }).default(new Date()),
});
