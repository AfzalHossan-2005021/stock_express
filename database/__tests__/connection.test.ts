/**
 * Database Connection Test Suite
 * Tests MongoDB connection, environment setup, and error handling
 */

import mongoose from 'mongoose'
import { connectToDatabase } from '../mongoose'

jest.setTimeout(90000) // Set global timeout for all tests in this suite

describe('Database Connection Tests', () => {
  // Store connection state to avoid reconnecting between tests
  let isConnected = false

  beforeAll(async () => {
    if (!isConnected) {
      await connectToDatabase()
      isConnected = true
    }
  })

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
      }
    } catch (error) {
      // Ignore errors during cleanup
    }
  })

  describe('Environment Setup', () => {
    test('should have MONGODB_URI defined', () => {
      expect(process.env.MONGODB_URI).toBeDefined()
      expect(process.env.MONGODB_URI).not.toBe('')
    })

    test('should have NODE_ENV set to test', () => {
      expect(process.env.NODE_ENV).toBe('test')
    })
  })

  describe('Connection State', () => {
    test('should be connected to database', async () => {
      const readyState = mongoose.connection.readyState
      expect(readyState).toBe(1) // 1 = connected
    })

    test('should have valid connection details', () => {
      expect(mongoose.connection.host).toBeDefined()
      expect(mongoose.connection.name).toBeDefined()
      expect(mongoose.connection.name).toBe('test') // Test database
    })
  })

  describe('Connection Client', () => {
    test('should have active database client', () => {
      const client = mongoose.connection.getClient()
      expect(client).toBeDefined()
    })

    test('should be able to ping database', async () => {
      const adminDb = mongoose.connection.db.admin()
      const pingResult = await adminDb.ping()
      expect(pingResult).toHaveProperty('ok', 1)
    })
  })
})
