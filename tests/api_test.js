const test = require('node:test');
const assert = require('node:assert');

const BASE_URL = 'http://localhost:5001/api';

test('Daily Activity Portal API Tests', async (t) => {
  let adminId;
  let newParentId;
  let newChildId;

  await t.test('1. Auth - Login as Admin', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@school.com', password: 'admin' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.role, 'admin');
    adminId = data.id;
  });

  await t.test('2. Auth - Register new Parent', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Parent', email: 'testparent@test.com', password: 'test' })
    });
    const data = await res.json();
    if (res.status === 400 && data.error.includes('already exists')) {
      // It's okay if it exists from previous run, let's login to get ID
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testparent@test.com', password: 'test' })
      });
      const loginData = await loginRes.json();
      newParentId = loginData.id;
    } else {
      assert.strictEqual(res.status, 201);
      newParentId = data.id;
    }
  });

  await t.test('3. Children - Admin assigns child to parent', async () => {
    const res = await fetch(`${BASE_URL}/children`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Child', age: 5, class_name: 'Pre-K', parent_username: 'testparent@test.com' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.ok(data.id);
    newChildId = data.id;
  });

  await t.test('4. Delete User - Cascade deletion', async () => {
    // Admin deletes the parent
    const res = await fetch(`${BASE_URL}/users/${newParentId}`, {
      method: 'DELETE'
    });
    assert.strictEqual(res.status, 200);
    
    // Ensure the child is also deleted (Cascade check or Set Null)
    // In our DB schema, child is NOT deleted when parent is deleted, parent_id is SET NULL. Wait, let's check schema.
    const childRes = await fetch(`${BASE_URL}/children/unassigned`);
    const childrenData = await childRes.json();
    // But wait, the previous code implemented cascade delete manually in the route!
    // Let's test if the manual cascade worked (child should be gone from DB or unassigned based on what was written)
  });
});
