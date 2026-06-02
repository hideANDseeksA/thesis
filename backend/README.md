```sql
-- Run this script if your database is Supabase
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'test'
    LOOP
        EXECUTE format(
            'ALTER TABLE test.%I ENABLE ROW LEVEL SECURITY;',
            r.tablename
        );
    END LOOP;
END $$;
```


```markdown
## Project Structure

The project is organized as follows:

```
src/
├── prisma.ts
├── server.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── certificate_generator_form.controller.ts
│   ├── certificates.controller.ts
│   ├── document_types.controller.ts
│   ├── document.controller.ts
│   ├── residents.controller.ts
│   ├── transaction.controller.ts
│   ├── user.controller.ts
├── helper/
│   ├── date.helper.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── decrypt.middleware.ts
│   ├── encrypt.middleware.ts
│   ├── rbac.middleware.ts
│   ├── rbac.ts
│   ├── upload.ts
├── routes/
│   ├── auth.routes.ts
│   ├── certificates.routes.ts
│   ├── document_types.routes.ts
│   ├── document.routes.ts
│   ├── residents.routes.ts
│   ├── transaction.routes.ts
│   ├── user.routes.ts
├── supabase/
│   ├── bucket.ts
├── utils/
│   ├── crypto.util.ts
│   ├── hash.util.ts
│   ├── jwt.util.ts
│   ├── supabaseDelete.util.ts
│   ├── supabaseUpdate.util.ts
│   ├── supabaseUpload.util.ts
│   ├── supabaseUrl.util.ts
│   ├── certificates/
│       ├── certificate.generator.ts
│       ├── helper.generateCertificate.ts
```

## How to Use

1. **Setup Database**: Run the provided SQL script to enable row-level security for your Supabase database.
2. **Install Dependencies**: Use `npm install` to install all required dependencies.
3. **Start the Server**: Run `npm start` to start the backend server.

## Key Features

- **Authentication**: Handled by `auth.controller.ts` and `auth.middleware.ts`.
- **Certificate Management**: Managed in `certificates.controller.ts` and `certificate.generator.ts`.
- **RBAC**: Role-based access control implemented in `rbac.middleware.ts`.
- **Supabase Integration**: Utilities for Supabase operations are in the `utils/` directory.

## Contribution

Feel free to contribute by submitting issues or pull requests. Ensure your code adheres to the existing project structure and coding standards.
<!-- 
This README file appears to be part of the "smart-barangay-backend" project. 
The purpose of this backend system is likely to manage and facilitate operations for a barangay (a local government unit in the Philippines). 

To document the APIs, you should include the following details for each endpoint:
1. Endpoint URL
2. HTTP Method (GET, POST, PUT, DELETE, etc.)
3. Description of the endpoint's purpose
4. Request parameters (query, path, or body)
5. Response structure (success and error responses)
6. Authentication requirements (if any)

Below is an example of how you can document each API:

### API Documentation

#### 1. [API Name or Endpoint]
**Method:** [HTTP Method]  
**Endpoint:** `/api/example`  
**Description:** [Explain what this API does, e.g., "Fetches a list of registered residents."]  
**Request Parameters:**  
- **Query Parameters:**  
    - `page` (optional, integer): The page number for pagination.  
    - `limit` (optional, integer): The number of items per page.  
- **Body Parameters:**  
    - `name` (optional, string): Filter results by name.  

**Response:**  
- **Success (200):**  
    ```json
    {
        "status": "success",
        "data": [/* array of items */]
    }
    ```
- **Error (400/500):**  
    ```json
    {
        "status": "error",
        "message": "Error message here"
    }
    ```

**Authentication:**  
- Requires a valid token in the `Authorization` header.

Repeat this structure for each API endpoint in your backend system to ensure clarity and ease of use for developers integrating with your system.
-->
```markdown
## API Routes Documentation

Below is a detailed description of all the routes available in the project:

### Authentication Routes

#### 1. Login
**Method:** POST  
**Endpoint:** `/auth/login`  
**Description:** Authenticates a user and returns a JWT token.  
**Request Parameters:**  
- **Body Parameters:**  
    - `email` (required, string): The user's email address.  
    - `password` (required, string): The user's password.  

**Response:**  
- **Success (200):**  
    ```json
    {
        "status": "success",
        "token": "jwt_token_here"
    }
    ```  
- **Error (401):**  
    ```json
    {
        "status": "error",
        "message": "Invalid credentials"
    }
    ```

**Authentication:**  
- Not required.

#### 2. Register
**Method:** POST  
**Endpoint:** `/auth/register`  
**Description:** Registers a new user.  
**Request Parameters:**  
- **Body Parameters:**  
    - `name` (required, string): The user's full name.  
    - `email` (required, string): The user's email address.  
    - `password` (required, string): The user's password.  

**Response:**  
- **Success (201):**  
    ```json
    {
        "status": "success",
        "message": "User registered successfully"
    }
    ```  
- **Error (400):**  
    ```json
    {
        "status": "error",
        "message": "Email already exists"
    }
    ```

**Authentication:**  
- Not required.

---

### Resident Routes

#### 1. Get All Residents
**Method:** GET  
**Endpoint:** `/residents`  
**Description:** Fetches a list of all residents.  
**Request Parameters:**  
- **Query Parameters:**  
    - `page` (optional, integer): The page number for pagination.  
    - `limit` (optional, integer): The number of items per page.  

**Response:**  
- **Success (200):**  
    ```json
    {
        "status": "success",
        "data": [/* array of residents */]
    }
    ```  
- **Error (500):**  
    ```json
    {
        "status": "error",
        "message": "Failed to fetch residents"
    }
    ```

**Authentication:**  
- Requires a valid token in the `Authorization` header.

#### 2. Add a Resident
**Method:** POST  
**Endpoint:** `/residents`  
**Description:** Adds a new resident to the database.  
**Request Parameters:**  
- **Body Parameters:**  
    - `name` (required, string): The resident's full name.  
    - `address` (required, string): The resident's address.  
    - `contact` (optional, string): The resident's contact number.  

**Response:**  
- **Success (201):**  
    ```json
    {
        "status": "success",
        "message": "Resident added successfully"
    }
    ```  
- **Error (400):**  
    ```json
    {
        "status": "error",
        "message": "Invalid data provided"
    }
    ```

**Authentication:**  
- Requires a valid token in the `Authorization` header.

---

### Certificate Routes

#### 1. Generate Certificate
**Method:** POST  
**Endpoint:** `/certificates/generate`  
**Description:** Generates a certificate for a resident.  
**Request Parameters:**  
- **Body Parameters:**  
    - `residentId` (required, string): The ID of the resident.  
    - `type` (required, string): The type of certificate to generate.  

**Response:**  
- **Success (200):**  
    ```json
    {
        "status": "success",
        "certificateUrl": "url_to_certificate"
    }
    ```  
- **Error (404):**  
    ```json
    {
        "status": "error",
        "message": "Resident not found"
    }
    ```

**Authentication:**  
- Requires a valid token in the `Authorization` header.

---

### Document Routes

#### 1. Upload Document
**Method:** POST  
**Endpoint:** `/documents/upload`  
**Description:** Uploads a document to the Supabase bucket.  
**Request Parameters:**  
- **Body Parameters:**  
    - `file` (required, file): The document file to upload.  

**Response:**  
- **Success (200):**  
    ```json
    {
        "status": "success",
        "message": "Document uploaded successfully"
    }
    ```  
- **Error (500):**  
    ```json
    {
        "status": "error",
        "message": "Failed to upload document"
    }
    ```

**Authentication:**  
- Requires a valid token in the `Authorization` header.

---

Repeat this structure for all other routes in the project, ensuring each route is clearly documented with its purpose, parameters, responses, and authentication requirements.
```


// add this in package json in deployment
 "_moduleAliases": {
  "@": "dist"
},


// add this in server.ts in deployement
import "module-alias/register"