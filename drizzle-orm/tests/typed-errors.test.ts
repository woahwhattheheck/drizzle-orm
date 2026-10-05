import { describe, expect, test } from 'vitest';
import { is } from '~/entity.ts';
import {
	CheckConstraintError,
	DrizzleQueryError,
	ForeignKeyConstraintError,
	isCheckConstraintError,
	isForeignKeyConstraintError,
	isNotNullConstraintError,
	isUniqueConstraintError,
	NotNullConstraintError,
	parseDatabaseError,
	UniqueConstraintError,
} from '~/errors.ts';

describe('Database Error Wrapping', () => {
	describe('PostgreSQL', () => {
		test('wraps 23505 unique violation', () => {
			const pgError = {
				code: '23505',
				constraint: 'users_email_unique',
				table: 'users',
				detail: 'Key (email)=(test@example.com) already exists.',
				schema: 'public',
			};
			const err = new DrizzleQueryError('INSERT INTO users ...', ['test@example.com'], pgError as any);
			expect(err).toBeInstanceOf(DrizzleQueryError);
			expect(err).toBeInstanceOf(UniqueConstraintError);
			expect(is(err, DrizzleQueryError)).toBe(true);
			expect(is(err, UniqueConstraintError)).toBe(true);
			expect(isUniqueConstraintError(err)).toBe(true);
			expect(err.isUniqueConstraint()).toBe(true);
			expect(err.kind).toBe('unique_constraint');
			expect(err.code).toBe('23505');
			expect(err.constraint).toBe('users_email_unique');
		});

		test('wraps 23503 fk violation', () => {
			const pgError = { code: '23503', constraint: 'orders_user_id_fk' };
			const err = new DrizzleQueryError('INSERT INTO orders ...', [], pgError as any);
			expect(err).toBeInstanceOf(ForeignKeyConstraintError);
			expect(isForeignKeyConstraintError(err)).toBe(true);
		});

		test('wraps 23502 not null violation', () => {
			const pgError = { code: '23502', column: 'email', table: 'users' };
			const err = new DrizzleQueryError('INSERT INTO users ...', [], pgError as any);
			expect(err).toBeInstanceOf(NotNullConstraintError);
			expect(isNotNullConstraintError(err)).toBe(true);
		});

		test('wraps 23514 check violation', () => {
			const pgError = { code: '23514', constraint: 'price_check' };
			const err = new DrizzleQueryError('INSERT INTO products ...', [], pgError as any);
			expect(err).toBeInstanceOf(CheckConstraintError);
			expect(isCheckConstraintError(err)).toBe(true);
		});
	});

	describe('MySQL', () => {
		test('wraps ER_DUP_ENTRY', () => {
			const mysqlError = { code: 'ER_DUP_ENTRY', errno: 1062, message: "Duplicate entry 'x' for key 'users.email_idx'" };
			const err = new DrizzleQueryError('INSERT...', [], mysqlError as any);
			expect(err).toBeInstanceOf(UniqueConstraintError);
			expect(err.constraint).toBe('email_idx');
		});
		test('wraps ER_NO_REFERENCED_ROW_2', () => {
			const mysqlError = { code: 'ER_NO_REFERENCED_ROW_2' };
			const err = new DrizzleQueryError('INSERT...', [], mysqlError as any);
			expect(err).toBeInstanceOf(ForeignKeyConstraintError);
		});
		test('wraps ER_BAD_NULL_ERROR', () => {
			const mysqlError = { code: 'ER_BAD_NULL_ERROR', message: "Column 'username' cannot be null" };
			const err = new DrizzleQueryError('INSERT...', [], mysqlError as any);
			expect(err).toBeInstanceOf(NotNullConstraintError);
			expect(err.column).toBe('username');
		});
	});

	describe('SQLite', () => {
		test('wraps UNIQUE', () => {
			const sqliteError = { code: 'SQLITE_CONSTRAINT', message: 'UNIQUE constraint failed: users.email' };
			const err = new DrizzleQueryError('INSERT...', [], sqliteError as any);
			expect(err).toBeInstanceOf(UniqueConstraintError);
			expect(err.table).toBe('users');
			expect(err.column).toBe('email');
		});
		test('wraps FOREIGN KEY', () => {
			const sqliteError = { message: 'FOREIGN KEY constraint failed' };
			const err = new DrizzleQueryError('INSERT...', [], sqliteError as any);
			expect(err).toBeInstanceOf(ForeignKeyConstraintError);
		});
		test('wraps NOT NULL', () => {
			const sqliteError = { message: 'NOT NULL constraint failed: profile.bio' };
			const err = new DrizzleQueryError('INSERT...', [], sqliteError as any);
			expect(err).toBeInstanceOf(NotNullConstraintError);
			expect(err.table).toBe('profile');
			expect(err.column).toBe('bio');
		});
	});

	describe('Fallback', () => {
		test('handles unknown gracefully', () => {
			const err = new DrizzleQueryError('SELECT 1', [], new Error('timeout'));
			expect(err).toBeInstanceOf(DrizzleQueryError);
			expect(err.kind).toBe('unknown');
		});
	});
});
