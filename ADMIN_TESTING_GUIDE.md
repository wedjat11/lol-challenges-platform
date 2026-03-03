# Admin Module - Manual Testing Guide

## Setup

1. Start the backend server:

   ```bash
   npm run start:dev
   ```

2. Create an admin user in the database:

   ```bash
   # Login to PostgreSQL
   psql lolchallenge

   # Set user role to ADMIN
   UPDATE users SET role = 'ADMIN' WHERE email = 'admin@test.com';
   ```

   Or create a new admin user:

   ```sql
   INSERT INTO users (id, username, email, password_hash, auth_provider, role, is_active, balance, created_at, updated_at)
   VALUES (
     gen_random_uuid(),
     'admin_test',
     'admin@test.com',
     '$2b$10$...',  -- bcrypt hash of password
     'EMAIL',
     'ADMIN',
     true,
     1000,
     now(),
     now()
   );
   ```

## Test Procedure

### 1. Get Admin Access Token

```bash
# Register or login as admin
curl -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "your-password"
  }' | jq '.accessToken' > admin_token.txt

ADMIN_TOKEN=$(cat admin_token.txt | tr -d '"')
```

### 2. Get Regular User Access Token (for testing 403)

```bash
# Register or login as regular user
curl -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "your-password"
  }' | jq '.accessToken' > user_token.txt

USER_TOKEN=$(cat user_token.txt | tr -d '"')
```

### 3. Test Access Control (403 for regular users)

```bash
# Regular user tries to access GET /v1/admin/users - should get 403
curl -X GET http://localhost:3001/v1/admin/users \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.'

# Expected: { "statusCode": 403, "code": "ADMIN_REQUIRED", message": "Admin access required" }
```

### 4. Test GET /admin/users (List Users)

```bash
# Admin can list users with filters
curl -X GET "http://localhost:3001/v1/admin/users?limit=10&search=test&isActive=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.users[0]'

# Response format:
# {
#   "id": "uuid",
#   "username": "testuser",
#   "email": "test@example.com",
#   "balance": 100,
#   "hasRiotAccount": false,
#   "isActive": true,
#   "role": "USER",
#   "authProvider": "EMAIL",
#   "createdAt": "2026-02-28T...",
#   "riotAccount": null
# }
```

### 5. Test GET /admin/users/:userId (Get User Details)

```bash
# Get user details including last 10 transactions
curl -X GET "http://localhost:3001/v1/admin/users/{USER_ID}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.'

# Response format:
# {
#   "user": { ... },
#   "transactions": [ { ...transactions... } ]
# }
```

### 6. Test PATCH /admin/users/:userId/status (User Deactivation)

```bash
# Get a user ID first
USER_ID=$(curl -s http://localhost:3001/v1/admin/users?limit=1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.users[0].id')

# Deactivate user
curl -X PATCH "http://localhost:3001/v1/admin/users/$USER_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false,
    "reason": "Account suspended for testing"
  }' | jq '.isActive'

# Expected output: false

# Verify in DB
psql lolchallenge -c "SELECT id, email, is_active FROM users WHERE id = '$USER_ID';"

# Try to login as that user - should fail
curl -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "suspended-user@test.com",
    "password": "password"
  }' | jq '.'

# Expected: { "statusCode": 401, "code": "INVALID_CREDENTIALS", "message": "Invalid email or password" }
```

### 7. Test POST /admin/economy/grant (Grant Coins)

```bash
# Create test user to grant coins to
curl -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "granttest",
    "email": "grant@test.com",
    "password": "testpass123"
  }' | jq '.user.id' > grant_user_id.txt

GRANT_USER_ID=$(cat grant_user_id.txt | tr -d '"')

# Check initial balance
curl -s "http://localhost:3001/v1/admin/users/$GRANT_USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.user.balance'

# Grant 250 coins
curl -X POST "http://localhost:3001/v1/admin/economy/grant" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$GRANT_USER_ID'",
    "amount": 250,
    "notes": "Testing admin grant functionality"
  }' | jq '.user.balance'

# Expected: 250 (or initial + 250)

# Verify in DB - should have coin_transaction with type ADMIN_GRANT
psql lolchallenge -c "SELECT user_id, amount, type, balance_after FROM coin_transactions WHERE user_id = '$GRANT_USER_ID' AND type = 'ADMIN_GRANT' ORDER BY created_at DESC LIMIT 1;"
```

### 8. Test POST /admin/economy/deduct (Deduct Coins)

```bash
# Check user balance before deduction
curl -s "http://localhost:3001/v1/admin/users/$GRANT_USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.user.balance' > balance_before.txt

BALANCE_BEFORE=$(cat balance_before.txt)

# Deduct 100 coins
curl -X POST "http://localhost:3001/v1/admin/economy/deduct" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$GRANT_USER_ID'",
    "amount": 100,
    "notes": "Testing admin deduction functionality"
  }' | jq '.user.balance'

# Expected: BALANCE_BEFORE - 100

# Verify in DB - should have coin_transaction with type ADMIN_DEDUCT
psql lolchallenge -c "SELECT user_id, amount, type, balance_after FROM coin_transactions WHERE user_id = '$GRANT_USER_ID' AND type = 'ADMIN_DEDUCT' ORDER BY created_at DESC LIMIT 1;"

# Test insufficient funds error
curl -X POST "http://localhost:3001/v1/admin/economy/deduct" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$GRANT_USER_ID'",
    "amount": 999999,
    "notes": "Trying to deduct more than available"
  }' | jq '.'

# Expected: { "statusCode": 422, "code": "INSUFFICIENT_FUNDS", "message": "..." }
```

### 9. Test POST /admin/templates (Create Template)

```bash
# Create a new validator template
curl -X POST "http://localhost:3001/v1/admin/templates" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Win 5 Games with Ahri",
    "description": "Complete 5 games with champion Ahri and win them all",
    "validatorKey": "custom_wins_ahri_5",
    "paramSchema": {
      "games": 5,
      "champion": "ahri"
    },
    "rewardFormula": "50",
    "isActive": true
  }' | jq '.validatorKey'

# Expected: custom_wins_ahri_5

# Verify in DB
psql lolchallenge -c "SELECT id, name, validator_key, is_active FROM challenge_templates WHERE validator_key = 'custom_wins_ahri_5';"
```

### 10. Test PATCH /admin/templates/:id (Update Template)

```bash
# Get template ID
TEMPLATE_ID=$(curl -s "http://localhost:3001/v1/templates" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[] | select(.validatorKey == "custom_wins_ahri_5") | .id')

# Update template
curl -X PATCH "http://localhost:3001/v1/admin/templates/$TEMPLATE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Win 3 Games with Ahri",
    "rewardFormula": "25",
    "isActive": false
  }' | jq '{name, rewardFormula, isActive}'

# Expected:
# {
#   "name": "Win 3 Games with Ahri",
#   "rewardFormula": "25",
#   "isActive": false
# }

# Verify in DB
psql lolchallenge -c "SELECT name, reward_formula, is_active FROM challenge_templates WHERE id = '$TEMPLATE_ID';"
```

## Verification Checklist

- [x] Non-admin users get 403 when accessing `/admin/*` endpoints
- [x] Admin users can list users with filters (search, hasRiotAccount, isActive)
- [x] Admin can deactivate users and they cannot login afterward
- [x] Admin can grant coins to users (balance increases + coin_transaction created)
- [x] Admin can deduct coins from users (balance decreases + coin_transaction created)
- [x] Admin cannotdeduct more coins than user has available (422 error)
- [x] Admin can create challenge templates with unique validatorKey
- [x] Admin can update templates (name, reward, isActive status)
- [x] All database changes are atomic and consistent
- [x] Deactivated users cannot generate new tokens (verified in AuthService)

## Expected Error Responses

### 403 - Admin Required

```json
{
  "statusCode": 403,
  "code": "ADMIN_REQUIRED",
  "message": "Admin access required"
}
```

### 404 - User/Template Not Found

```json
{
  "statusCode": 404,
  "code": "USER_NOT_FOUND",
  "message": "User not found"
}
```

### 422 - Insufficient Funds

```json
{
  "statusCode": 422,
  "code": "INSUFFICIENT_FUNDS",
  "message": "User has insufficient balance. Has 50, trying to deduct 100."
}
```

### 409 - Conflict (Duplicate validatorKey)

```json
{
  "statusCode": 409,
  "code": "VALIDATOR_KEY_EXISTS",
  "message": "Validator key already exists"
}
```
