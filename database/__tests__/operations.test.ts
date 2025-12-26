/**
 * Database Operations Test Suite
 * Tests CRUD operations on MongoDB
 */

import mongoose, { Schema, Document } from 'mongoose'
import { connectToDatabase } from '../mongoose'

// Test model
interface TestUser extends Document {
  name: string
  email: string
  createdAt: Date
}

let TestUserModel: mongoose.Model<TestUser>

describe('Database Operations Tests', () => {
  beforeAll(async () => {
    await connectToDatabase()

    // Define test schema
    const testSchema = new Schema<TestUser>({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      createdAt: { type: Date, default: Date.now },
    })

    // Create or get model
    TestUserModel = mongoose.models.TestUser || mongoose.model('TestUser', testSchema)
  })

  beforeEach(async () => {
    // Clear test collection before each test
    await TestUserModel.deleteMany({})
  })

  afterAll(async () => {
    // Clean up test collection
    await TestUserModel.deleteMany({})
    await mongoose.disconnect()
  })

  describe('Create Operations', () => {
    test('should create a document', async () => {
      const user = await TestUserModel.create({
        name: 'Test User',
        email: 'test@example.com',
      })

      expect(user._id).toBeDefined()
      expect(user.name).toBe('Test User')
      expect(user.email).toBe('test@example.com')
    })

    test('should fail to create duplicate email', async () => {
      await TestUserModel.create({
        name: 'User 1',
        email: 'duplicate@example.com',
      })

      await expect(
        TestUserModel.create({
          name: 'User 2',
          email: 'duplicate@example.com',
        })
      ).rejects.toThrow()
    })

    test('should fail to create without required fields', async () => {
      await expect(
        TestUserModel.create({ name: 'Test' })
      ).rejects.toThrow()
    })
  })

  describe('Read Operations', () => {
    beforeEach(async () => {
      await TestUserModel.create([
        { name: 'User 1', email: 'user1@example.com' },
        { name: 'User 2', email: 'user2@example.com' },
        { name: 'User 3', email: 'user3@example.com' },
      ])
    })

    test('should find all documents', async () => {
      const users = await TestUserModel.find({})

      expect(users).toHaveLength(3)
      expect(users[0].name).toBeDefined()
    })

    test('should find document by id', async () => {
      const user = await TestUserModel.findOne({ email: 'user1@example.com' })
      const foundUser = await TestUserModel.findById(user?._id)

      expect(foundUser).toBeDefined()
      expect(foundUser?.name).toBe('User 1')
    })

    test('should find document by query', async () => {
      const user = await TestUserModel.findOne({ email: 'user2@example.com' })

      expect(user).toBeDefined()
      expect(user?.name).toBe('User 2')
    })

    test('should count documents', async () => {
      const count = await TestUserModel.countDocuments()

      expect(count).toBe(3)
    })
  })

  describe('Update Operations', () => {
    test('should update document by id', async () => {
      const user = await TestUserModel.create({
        name: 'Original Name',
        email: 'update@example.com',
      })

      const updated = await TestUserModel.findByIdAndUpdate(
        user._id,
        { name: 'Updated Name' },
        { new: true }
      )

      expect(updated?.name).toBe('Updated Name')
      expect(updated?.email).toBe('update@example.com')
    })

    test('should update multiple documents', async () => {
      await TestUserModel.create([
        { name: 'User 1', email: 'bulk1@example.com' },
        { name: 'User 2', email: 'bulk2@example.com' },
      ])

      const result = await TestUserModel.updateMany(
        { name: /User/ },
        { name: 'Bulk Updated' }
      )

      expect(result.modifiedCount).toBe(2)
    })
  })

  describe('Delete Operations', () => {
    test('should delete document by id', async () => {
      const user = await TestUserModel.create({
        name: 'To Delete',
        email: 'delete@example.com',
      })

      await TestUserModel.findByIdAndDelete(user._id)
      const found = await TestUserModel.findById(user._id)

      expect(found).toBeNull()
    })

    test('should delete multiple documents', async () => {
      await TestUserModel.create([
        { name: 'User 1', email: 'del1@example.com' },
        { name: 'User 2', email: 'del2@example.com' },
      ])

      const result = await TestUserModel.deleteMany({ name: /User/ })

      expect(result.deletedCount).toBe(2)
    })
  })
})
