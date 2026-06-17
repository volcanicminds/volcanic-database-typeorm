/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from 'expect'
import { useOrder, useWhere } from '../../lib/query.js'
import { parseLogicExpression } from '../../lib/query/parser.js'

describe('Magic Query', () => {
  describe('useOrder', () => {
    it('parses field:direction pairs', () => {
      expect(useOrder(['name:asc', 'age:desc'])).toEqual({ name: 'asc', age: 'desc' })
    })

    it('skips fields with invalid identifiers (injection guard)', () => {
      expect(useOrder(['name; DROP TABLE users:asc'])).toEqual({})
    })

    it('does not pollute Object.prototype', () => {
      useOrder(['__proto__.polluted:asc'])
      expect(({} as any).polluted).toBeUndefined()
    })
  })

  describe('useWhere', () => {
    it('builds an equality condition by default', () => {
      const { allConditions } = useWhere({ name: 'foo' })
      expect(allConditions.name).toBeDefined()
    })

    it('never exposes sensitive fields', () => {
      const { allConditions } = useWhere({ password: 'x', mfaSecret: 'y', resetPasswordToken: 'z' })
      expect(allConditions.password).toBeUndefined()
      expect(allConditions.mfaSecret).toBeUndefined()
      expect(allConditions.resetPasswordToken).toBeUndefined()
    })

    it('skips invalid identifiers (injection guard)', () => {
      const { allConditions } = useWhere({ 'name; DROP TABLE': 'x' })
      expect(Object.keys(allConditions)).toHaveLength(0)
    })

    it('does not pollute Object.prototype', () => {
      useWhere({ __proto__: 'x', constructor: 'y' })
      expect(({} as any).polluted).toBeUndefined()
    })
  })

  describe('parseLogicExpression', () => {
    it('parses a simple AND tree', () => {
      const ast: any = parseLogicExpression('a AND b')
      expect(ast.type).toBe('AND')
      expect(ast.left).toMatchObject({ type: 'operand', value: 'a' })
      expect(ast.right).toMatchObject({ type: 'operand', value: 'b' })
    })

    it('respects parentheses precedence', () => {
      const ast: any = parseLogicExpression('a AND (b OR c)')
      expect(ast.type).toBe('AND')
      expect(ast.right.type).toBe('OR')
    })

    it('throws on mismatched parentheses', () => {
      expect(() => parseLogicExpression('(a AND b')).toThrow()
    })
  })
})
