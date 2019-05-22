FMS mobile API Server

http://localhost:8000

This server is only meant to be a REST server.

- [Install](#install)
- [Environment variables](#environment-variables)
- [Dependencies](#dependencies)
- [Public API](#public-api)
  - [User](#user)
    - [Create Acount - `/`](#create-acount)
    - [Reset default password - `/reset-default-password`](#reset-default-password)
    - [Login - `/login`](#login)
    - [Change Password - `/changePassword`](#change-password)
    - [All Users - `/all`](#all-Users)
    - [Change Active Tenant - `/activateTenant`](#change-active-tenant)
    - [Add Tenant - `/addTenant`](#add-tenant)
    - [Delete Tenant - `/deleteTenant`](#delete-tenant)
  - [Responsibles](#responsibles)
    - [New responsible - `/new`](#new-responsible)
    - [View All Responsibles - `/all`](#view-all-responsibles)
    - [View all responsibles active - all-actives](#view-all-responsibles-active)
    - [Find responsible - `/responsible`](#find-responsible)
    - [Reverve responsible - `/reverve-responsible`](#reverve-responsible)
    - [Release responsible - `/release`](#release-responsible)
  - [Missions](#missions)
    - [View Missions - `/view`](#View Missions)
  - [Messages](#Messages)
    - [View Messages - `/view`](#view-messages)
    - [New Message - `/new`](#new-message)
    - [Update Messages - `/update`](#update-messages)
  - [Companies](#companies)
    - [New Companies - `/new`](#new-companies)
    - [Reset default password Company - `/reset-default-password`](#reset-default-password-Company)
    - [Verify company password - `/verify-company-password`](#verify-company-password)
    - [All Company - `/all`](#all-company)
  - [Calls`](#calls)
    - [New Call - `/new`](#new-call)
    - [All Calls filtered - `/all-filtered`](#all-calls-filtered)
    - [All Calls - `/all`](#all-calls)
  - [Callers](#callers)
    - [New Caller - `/new`](#new-caller)
    - [All Callers - `/all`](#all-callers)

## Install

```sh
$ npm install
```

## Environment variables

 * `PORT` - port for the rest server to start on. Default: *4000*
 * `APLICATION_EMAIL` - address from which email is sent
 * `APLICATION_PASSWORD` - password from that email
 * `DB_CONNECT` - database where app must conect
 * `CLIENT_ADDRESS` - address from the client app

 Set environment variables when start application

  > Create *env.json* file in current directory with those variables
  >```json
  {
   "PORT": 80
  }
  >```

## Run

  ```sh
  # node server # starts the server for development
  ```

  * "body-parser": "^1.18.3",
  * "cors": "^2.8.5",
  * "errorhandler": "^1.5.0",
  * "express": "^4.16.4",
  * "express-jwt": "^5.3.1",
  * "jsonwebtoken": "^8.5.1",
  * "moment": "^2.24.0",
  * "mongoose": "^5.4.20",
  * "morgan": "^1.9.1",
  * "nodemailer": "^6.1.0",
  * "passport": "^0.4.0",
  * "passport-local": "^1.0.0",
  * "socket.io": "^2.2.0",
  * "superagent": "^4.1.0"

## Public API

### Authentication

 Every API call needs to have an `access token` in request header or as parameter

 > * In request header: `Authorization: Bearer 063af88a653d53903f9434ad82d4581e1ce9629d62bd430ea21c60df6cf4dc80`
 > * In request parameters as `GET https://ls1-dev.mdlz.cloud/audits?access_token=063af88a653d53903f9434ad82d4581e1ce9629d62bd430ea21c60df6cf4dc80`

 To get this access token you need to provide LS1 user `email/password` in exchange

 Access token is valid only for a limited period of time, after which you need to get a new access token using
 your `email/password` or using `refresh token` received along with `access token` in authentication process

 > Note:
 > There are a few API calls that do not require authentication token (public access). Check for `Authorization: false` in API method description

##### User

###### Create Acount

  Use LS1 user login email (as *username* below) and password

  * Path: `/`
  * Method: **POST**
  * Body:

  ```js
  {
     user: {
      email: String,
      password: String,
     }
  }
  ```

  * Returns:

  ```js
  {
     access_token: String,
     refresh_token: String,
     expires_in: Number,           // seconds
     token_type: 'Bearer',
     user: {
       name: String,
       email: String
     }
  }
  ```

  * Throws
   * email: 'is required'
   * password: 'is required'
   * Email already exists!

###### Reset default password
  * Path: `/reset-default-password`
  * Method: **POST**
  * Body:

  ```js
  {
    user: {
     password: String,
    }
  }
  ```

  * Returns:

  ```js
  {
    access_token: String,
    refresh_token: String,
    expires_in: Number,           // seconds
    token_type: 'Bearer',
    user: {
      name: String,
      email: String
    }
  }
  ```

  * Throws
  * password: 'is required'
  * Seems that the url address has been expired!

###### Login
  * Path: `/login`
  * Method: **POST**
  * Body:

  ```js
  {
    user: {
     email: String,
     password: String,
    }
  }
  ```

  * Returns:

  ```js
  {
  access_token: String,
  refresh_token: String,
  expires_in: Number,           // seconds
  token_type: 'Bearer',
  user: {
    name: String,
    email: String
  }
  }
  ```

  * Throws
    * email: 'is required'
    * password: 'is required'
    * No user found with these credentials!

###### Change Password
  * Path: `/changePassword`
  * Method: **POST**
  * Body:

  ```js
  {
     oldPassword: String,
     newPassword: String,
  }
  ```

  * Returns:

  ```js
  {
    ok: Boolean
  }
  ```

  * Throws
    * old password: 'is required'
    * newPassword: 'is required'
    * Your account doesn\'t exist anymore!
    * Invalid password!

###### All Users
  * Path: `/all`
  * Method: **GET**
  * Parameters:
    * id - required. The ID of the upload
  * Code 200
  * Response JSON

  ```js
  {
    users: Array
  }
  ```

  * Throws
    * Your account doesn\'t exist anymore!

###### Change Active Tenant
  * Path: `/activateTenant`
  * Method: **POST**
  * Body:

  ```js
  {
     activeTenant: String,
  }
  ```

  * Returns:

  ```js
  {
    activeTenant: String
  }
  ```

  * Throws
    * activeTenant: 'is required'
    * Your account doesn\'t exist anymore!

###### Add Tenant
  * Path: `/addTenant`
  * Method: **POST**
  * Body:

  ```js
  {
     tenantsList: Array,
  }
  ```

  * Returns:

  ```js
  {
    tenantsList: Array
  }
  ```

  * Throws
    * tenantsList: 'is required'
    * Your account doesn\'t exist anymore!

###### Delete Tenant
  * Path: `/deleteTenant`
  * Method: **POST**
  * Body:

  ```js
  {
     tenantsList: Array,
     tenantDeleted: String
  }
  ```

  * Returns:

  ```js
  {
    tenantsList: Array
  }
  ```

  * Throws
    * tenantsList: 'is required'
    * Your account doesn\'t exist anymore!


##### Responsibles

###### New responsible
  * Path: `/new`
  * Method: **POST**
  * Body:

  ```js
  {
     responsible: Object,
  }
  ```

  * Returns:

  ```js
  {
    ok: Boolean
  }
  ```

  * Throws
    * name: 'is required'
    * email: 'is required'
    * phone number: 'is required'
    * Email already exists!
    * Your account doesn\'t exist anymore!

###### View All Responsibles
  * Path: `/all`
  * Method: **GET**
  * Parameters:
    * id - required. The ID of the upload
  * Code 200
  * Response JSON

  * Returns:

  ```js
  {
    responsibles: Array
  }
  ```

  * Throws
    * Your account doesn\'t exist anymore!

###### View all responsibles active
  * Path: `/all-actives`
  * Method: **GET**
  * Parameters:
    * id - required. The ID of the upload
  * Code 200
  * Response JSON

  * Returns:

  ```js
  {
    responsibles: Array
  }
  ```

  * Throws
    * name: 'is required'
    * email: 'is required'
    * phone number: 'is required'
    * Email already exists!
    * Your account doesn\'t exist anymore!

###### Find responsible
  * Path: `/responsible`
  * Method: **POST**
  * Body:

  ```js
  {
     id: String,
  }
  ```

  * Returns:

  ```js
  {
    ok: Boolean
  }
  ```

  * Throws
    * The responsible doesn\'t exist now!
    * Your account doesn\'t exist anymore!

###### Reverve responsible
  * Path: `/reserve-responsible`
  * Method: **POST**
  * Body:

  ```js
  {
     respId: String,
     uniqueId: String
  }
  ```

  * Returns:

  ```js
  {
    ok: Boolean,
    id: String
  }
  ```

  * Throws
    * This responsible has been reserved already!
    * The responsible doesn\'t exist now!
    * Your account doesn\'t exist anymore!
    * Error to the server! Please refresh the page!

###### Release responsible
  * Path: `/release`
  * Method: **POST**
  * Body:

  ```js
  {
     uniqueId: String
  }
  ```

  * Returns:

  ```js
  {
    ok: Boolean
  }
  ```

  * Throws
    * Error to the server! Please refresh the page!
    * Your account doesn\'t exist anymore!
    * Error to the server! Please refresh the page!

##### Missions

###### View Missions
   * Path: `/view`
   * Method: **POST**

   * Returns:
   ```js
   {
     missions: Array
   }
   ```

    * Throws
      * Your account doesn\'t exist anymore!

##### Messages
###### View Messages
   * Path: `/view`
   * Method: **POST**
   * Body:

   ```js
   {
      callIndex - String
   }
   ```

   * Returns:
   ```js
   {
     messages: Array
   }
   ```

    * Throws
      * callIndex: 'Is required!'
      * Your account doesn\'t exist anymore!

###### New Message
 * Path: `/new`
 * Method: **POST**
 * Body:

 ```js
 {
    newMessage - Object
 }
 ```

 * Returns:
 ```js
 {
   ok: Boolean
 }
 ```

  * Throws
    * newMessage: 'Is required!'
    * CallIndex: 'Is required!'
    * Your account doesn\'t exist anymore!

###### Update Messages
   * Path: `/update`
   * Method: **POST**
   * Body:
   ```js
   {
      callIndex - String
      primaryTenant - String
      activeTenant - String
   }
   ```

   * Returns:
   ```js
   {
     ok: Boolean
   }
   ```

    * Throws
      * callIndex: 'Is required!'
      * primaryTenant: 'Is required!'
      * activeTenant: 'Is required!'
      * Your account doesn\'t exist anymore!  

##### Companies
###### New Companies
   * Path: `/new`
   * Method: **POST**
   * Body:
   ```js
   {
      company - Object
   }
   ```

   * Returns:
   ```js
   {
     ok: Boolean
   }
   ```

    * Throws
      * name: 'Is required!'
      * email: 'Is required!'
      * Email already exists!
      * Your account doesn\'t exist anymore!


###### Reset default password Company
   * Path: `/reset-default-password`
   * Method: **POST**
   * Body:
   ```js
   {
      password - String
   }
   ```

   * Returns:
   ```js
   {
     ok: Boolean
   }
   ```

    * Throws
      * password: 'Is required!'
      * Seems that the url address has been expired!

###### Verify company password
   * Path: `/verify-company-password`
   * Method: **POST**
   * Body:
   ```js
   {
      companyId - String
      password - String
   }
   ```

   * Returns:
   ```js
   {
     validate: Object
   }
   ```
   * Throws
     * companyId: 'Is required!'
     * password: 'Is required!'
     * Your account doesn\'t exist anymore!

###### All Company
   * Path: `/all`
   * Method: **GET**
   * Parameters:
      * id -required
   * Code 200
   * Response JSON

   ```js
   {
     companies: Array
   }
   ```

    * Throws
      * callIndex: 'Is required!'
      * primaryTenant: 'Is required!'
      * activeTenant: 'Is required!'
      * Your account doesn\'t exist anymore!  


##### Calls
###### New Call
  * Path: `/new`
  * Method: **POST**
  * Body:
  ```js
  {
     newCall - Object
  }
  ```

  * Returns:
  ```js
  {
    ok: Boolean
  }
  ```
  * Throws
    * caller: 'Is required!'
    * Event Address: 'Is required!'
    * responsible: 'Is required!'
    * Your account doesn\'t exist anymore!


###### All Calls filtered
  * Path: `/all-filtered`
  * Method: **POST**
  * Body:
  ```js
  {
     filters - Object
  }
  ```

  * Returns:
  ```js
  {
    calls: Array
  }
  ```
  * Throws
    * Your account doesn\'t exist anymore!

###### All Calls
   * Path: `/all`
   * Method: **GET**
   * Parameters:
      * id -required
   * Code 200
   * Response JSON

   ```js
   {
     calls: Array
   }
   ```

    * Throws
      * Your account doesn\'t exist anymore!


##### Callers
###### New Caller
  * Path: `/new`
  * Method: **POST**
  * Body:
  ```js
  {
     caller - Object
  }
  ```

  * Returns:
  ```js
  {
    caller: {
      _id: String,
      company: String,
      companyId: String,
      name: String,
      ssn: String,
    }
  }
  ```
  * Throws
    * name: 'Is required!'
    * email: 'Is required!'
    * Caller already exists!
    * Your account doesn\'t exist anymore!

###### All Callers
   * Path: `/all`
   * Method: **GET**
   * Parameters:
      * id -required
   * Code 200
   * Response JSON

   ```js
   {
     callers: Array
   }
   ```

    * Throws
      * Your account doesn\'t exist anymore!
