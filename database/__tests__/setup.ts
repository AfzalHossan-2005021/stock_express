/**
 * Integration Test Setup
 * Test configuration for Jest with MongoDB
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.test.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Set test environment variables
process.env.NODE_ENV = 'test'

// Increase default timeout
jest.setTimeout(30000)

// Global test setup
beforeAll(async () => {
  // Set default timeout
}, 30000)

// Global test teardown
afterAll(async () => {
  // Close all mongoose connections
  try {
    await mongoose.disconnect()
  } catch (error) {
    // Ignore errors during cleanup
  }
}, 15000)

export {}
