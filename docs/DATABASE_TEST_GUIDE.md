# Database Testing Guide

This guide explains how to run and maintain the MongoDB connection and operations tests for the Stock Express application.

## ✅ Test Status

All tests passing:
- **Connection Tests:** 6 passing ✓
- **Operations Tests:** 11 passing ✓
- **Total:** 17 passing ✓
- **Execution Time:** ~5 seconds

## Overview

The test suite validates:
- ✅ MongoDB connection establishment
- ✅ Environment variable configuration
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Database constraints and validations

## Test Files

### 1. Connection Tests (`tests/database/__tests__/connection.test.ts`)
Tests MongoDB connectivity and database configuration.

**Test Cases:**
- Environment setup (MONGODB_URI defined, NODE_ENV=test)
- Connection state (ready state = 1/connected)
- Connection details (host, database name, port)
- Database client availability
- Database ping functionality

**Expected Results:** 6 tests pass in ~1 second

```bash
npm test -- connection.test.ts
```

### 2. Operations Tests (`tests/database/__tests__/operations.test.ts`)
Tests CRUD operations with a test model (TestUser).

**Test Cases:**

**Create Operations:**
- Create valid document
- Reject duplicate emails (unique constraint)
- Reject documents missing required fields

**Read Operations:**
- Find all documents
- Find document by ID
- Find document by query
- Count documents

**Update Operations:**
- Update document by ID
- Update multiple documents

**Delete Operations:**
- Delete document by ID
- Delete multiple documents

**Expected Results:** 11 tests pass in ~4 seconds

```bash
npm test -- operations.test.ts
```

### 3. Quick Connection Test (`tests/database/__tests__/quick-test.js`)
Standalone Node.js script for quick connection validation without Jest.

**Features:**
- Colored console output
- Connection timing information
- Detailed connection details
- Database ping test

**Usage:**
```bash
node tests/database/__tests__/quick-test.js
```

or via npm script:
```bash
npm run test:db
```

## Running Tests

### Run All Tests
```bash
npm test
```
Expected: 17 tests pass, ~5 seconds

### Run Specific Test Suite
```bash
npm test -- connection.test.ts
npm test -- operations.test.ts
```

### Run with Watch Mode
```bash
npm run test:watch
```

### Run with Coverage Report
```bash
npm run test:coverage
```

### Quick Manual Test
```bash
npm run test:db
```
or
```bash
node tests/database/__tests__/quick-test.js
```

## Configuration

### Environment Variables (`.env.test.local`)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/test
NODE_ENV=test
```

### Jest Configuration (`jest.config.js`)
- **Test Match Pattern:** `**/__tests__/**/*.test.ts`
- **TypeScript Transform:** `ts-jest`
- **Global Setup:** `tests/database/__tests__/setup.ts`
- **Default Timeout:** 90 seconds (set in connection.test.ts)

### Setup File (`tests/database/__tests__/setup.ts`)
Loads environment variables before tests run:
```typescript
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test.local' });
dotenv.config({ path: '.env' });

process.env.NODE_ENV = 'test';
```

## Mongoose Connection

The connection is managed in `database/mongoose.ts` with caching:

```typescript
export const connectToDatabase = async () => {
  if (cached.conn) return cached.conn; // Return cached connection
  
  // Create new connection if not cached
  const conn = await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });
  
  cached.conn = conn;
  return conn;
}
```

**Key Points:**
- Connection is cached to avoid multiple concurrent connections
- First connection takes ~1-2 seconds
- Subsequent calls within same test session reuse cached connection
- Each test suite maintains separate connection state

## Test Models

### TestUser (used in operations.test.ts)
```typescript
const TestUserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  age: Number,
  createdAt: { type: Date, default: Date.now },
});
```

## Troubleshooting

### Tests Timeout
**Problem:** "Exceeded timeout of 90000 ms"

**Solutions:**
1. Check MongoDB Atlas IP whitelist allows your machine
2. Verify MONGODB_URI is correct in `.env.test.local`
3. Check internet connection to MongoDB cluster
4. Increase timeout: `jest.setTimeout(120000)` in test file

### Connection Refused
**Problem:** "connection refused" or "ECONNREFUSED"

**Solutions:**
1. Verify MONGODB_URI format: `mongodb+srv://user:pass@cluster.db.mongodb.net/database`
2. Ensure special characters in password are URL-encoded (`#` → `%23`)
3. Check MongoDB Atlas cluster is running
4. Verify the MongoDB Atlas IP access list includes your machine's current public IP (or a restricted corporate/VPN range). Avoid using `0.0.0.0/0`, even for testing, as it exposes the database to the entire internet.

### Authentication Failed
**Problem:** "authentication failed" or "Invalid username or password"

**Solutions:**
1. Verify username and password in MONGODB_URI
2. Check MongoDB Atlas user has database access
3. Ensure special characters are URL-encoded in password
4. Confirm user is in correct project/organization

### Tests Pass Locally but Fail in CI/CD
**Problem:** Tests work locally but fail in GitHub Actions/CI

**Solutions:**
1. Set MongoDB URI in CI/CD secrets
2. Whitelist CI/CD server IP in MongoDB Atlas
3. Use `NODE_ENV=test` environment variable
4. Ensure `ts-jest` and `@types/jest` are in devDependencies

## Best Practices

### Writing New Tests
1. Set `jest.setTimeout(90000)` if test makes database calls
2. Use `beforeAll()` to connect once per suite
3. Use `afterAll()` to disconnect and cleanup
4. Test both success and failure cases
5. Use meaningful test descriptions
6. Clean up test data in `afterEach()` if needed

### Example Test
```typescript
import { connectToDatabase } from '../mongoose'

describe('My Feature Tests', () => {
  jest.setTimeout(90000)
  
  beforeAll(async () => {
    await connectToDatabase()
  })
  
  afterAll(async () => {
    await mongoose.disconnect()
  })
  
  test('should do something', async () => {
    const result = await SomeModel.create({ data: 'test' })
    expect(result).toBeDefined()
    expect(result.data).toBe('test')
  })
})
```

### Test Data Cleanup
Always clean up test data:
```typescript
afterEach(async () => {
  await TestUser.deleteMany({})
})
```

## Performance Notes

- **Connection Time:** First connection takes ~1-2 seconds (includes network handshake)
- **Subsequent Calls:** <50ms (cached connection)
- **Database Operations:** 50-700ms depending on query complexity
- **Full Test Suite:** ~5 seconds for 17 tests

## Database Reset for Testing

To reset test database between test runs:

```bash
# Via mongosh (MongoDB shell)
mongosh "mongodb+srv://username:password@cluster.mongodb.net/test"
> db.dropDatabase()
```

Or programmatically in tests:
```typescript
afterEach(async () => {
  // Drop all test collections
  const collections = mongoose.connection.collections
  for (const collection of Object.values(collections)) {
    await collection.deleteMany({})
  }
})
```

## Continuous Integration

For GitHub Actions or similar CI/CD:

1. **Add secrets to repo:**
   - `MONGODB_URI` - Full connection string with credentials

2. **Example GitHub Actions workflow:**
```yaml
name: Database Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          NODE_ENV: test
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Mongoose Documentation](https://mongoosejs.com/)
- [ts-jest Configuration](https://kulshekhar.github.io/ts-jest/)

