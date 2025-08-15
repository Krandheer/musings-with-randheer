---
title: Deep-dive in Authentication using firebase and understanding JWT working
tags:
  - Golang
  - Authentication
  - JWT
  - Firebase
---
> This isn’t just a tutorial — it’s a **full education** in authentication, JWT, Firebase, and integrating it all in a Go + Flutter app.

## Table of Contents

1. Introduction — Why Authentication Matters
2. Authentication vs Authorization — Full Conceptual Clarity
3. Session-Based vs Token-Based Authentication — Old School vs Modern
4. JWT Deep Dive — Internals, Structure, and Security
5. Where Firebase Fits — Why it’s a Game-Changer
6. Firebase Setup — Step-by-Step (Zero Confusion)
7. Flutter App — Authentication Implementation
8. Go Backend — JWT Verification with Firebase Admin 
9. Role-Based Access Control (RBAC)
10. Token Expiry, Refresh, and Revocation
11. Security Best Practices

---
### 1. Introduction — Why Authentication Matters

Imagine you run a private club. People can only enter if they **prove who they are**. Once they’re in, their **membership type** determines where they can go — VIP lounge, bar, gym, etc.
In software:
- **Authentication** = checking _who_ is at the door.
- **Authorization** = deciding _what_ they can access.

If you skip authentication, you’re leaving the doors open to _everyone_, including bad actors.  
If you skip authorization, anyone who’s authenticated can do _everything_, even if they shouldn’t.

Authentication is the gatekeeper of your application. Without it:
- Anyone can impersonate anyone else.
- Private data becomes public.
- Your app becomes vulnerable to attacks.

In the modern web & mobile world, **authentication isn’t optional**, it’s essential. Firebase makes it easier, but you still need to understand the concepts to use it securely.

----
### 2. Authentication vs Authorization — Understand the Difference

| **Authentication**      | **Authorization**                      |
| ----------------------- | -------------------------------------- |
| Verifies _who you are_. | Decides _what you can do_.             |
| Happens first.          | Happens after authentication.          |
| Example: Logging in.    | Example: Only admins can delete posts. |

---
### 3. Session-Based vs Token-Based Authentication — Old School vs Modern

Historically, websites used **session-based authentication**, but modern apps often use **token-based authentication** (like JWTs).  
Let’s compare them.

#### **Session-Based Authentication**
**Flow:**
1. You log in.
2. Server stores your session in memory or a database.
3. Server sends you a cookie with a session ID.
4. Every request sends that cookie.
5. Server checks session ID in DB/memory.

**Pros:**
- Simple to implement.
- Works well for server-rendered websites.

**Cons:**
- Doesn’t scale well for distributed systems (need shared session store).
- Harder for mobile apps and APIs to use cookies.

#### **Token-Based Authentication (JWT)**
**Flow:**
1. You log in.
2. Server or identity provider (like Firebase) generates a signed token (JWT).
3. Client stores the token (local storage, secure storage).
4. Every request includes the token in the `Authorization` header.
5. Server verifies the token’s signature and reads the claims — no DB lookup.

**Pros:**
- Stateless — no server memory used for sessions.
- Works great for APIs, mobile apps, microservices.
- Easy to integrate with multiple platforms.

**Cons:**
- Token revocation is trickier (need short lifetimes or block lists).
- Must be stored securely on the client.

#### **Why Modern Apps Prefer Token-Based**
- Mobile-first world — tokens work the same on mobile, web, IoT.
- Cloud & microservices — tokens can be verified without central DB.
- Scalability — no need to sync sessions across servers.

---
### 4. JWT Deep Dive — Internals, Structure, and Security

JWT stands for **JSON Web Token**.
Think of it as **a sealed envelope containing your identity and permissions**. Anyone can open it to read the contents, but only the issuer can sign it, so others know it’s genuine.

JWT has three parts, separated by dots:
```css
header.payload.signature
```

#### 1. Header
Describes token type & algorithm:
```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

`alg` = algorithm used for signing (Firebase uses RS256 — asymmetric encryption).

#### 2. Payload
Contains claims (data about the user), base64 encoded:
```json
{
  "iss": "https://securetoken.google.com/myapp-123",
  "aud": "myapp-123",
  "auth_time": 1690000000,
  "user_id": "UID123",
  "email": "john@example.com",
  "role": "admin"
}
```

- **Standard claims**: `iss` (issuer), `aud` (audience), `exp` (expiry).
- **Custom claims**: `role`, `permissions`, etc.

#### 3. Signature
- Created by taking `header + payload` and signing with a secret/private key.
- If anyone modifies the header or payload, the signature will not match.

#### Why JWT is secure
- You **can read** the payload (it’s not encrypted by default) — but you **cannot modify** it without breaking the signature.
- Server verifies signature before trusting data.

#### Analogy:
JWT = passport:
- Header = format of passport.
- Payload = your identity details.
- Signature = government stamp that can’t be forged.

---
### 5. Where Firebase Fits — Why it’s a Game-Changer

Firebase is a **trusted identity provider**.  
When a user signs in:

1. Firebase **authenticates** them (via password, Google login, etc.)
2. Firebase issues a **JWT (ID Token)** that contains:
    - User ID (`uid`)
    - Email
    - Auth provider info
    - Any **custom claims** you add (like roles)

3. The frontend sends this token to your backend in the `Authorization: Bearer <token>` header.
4. Your backend uses the **Firebase Admin SDK** to verify the token and ensure:
    - It’s signed by Firebase.
    - It hasn’t expired.
    - Claims are valid.

```scss
Flutter App  --[login]-->  Firebase Auth  
Flutter App  <--[JWT]--    Firebase Auth  
Flutter App  --[JWT]-->    Go Backend (Gorilla/Mux)  
Go Backend  --[verify]--> Firebase Admin SDK
```

#### Why Firebase + JWT is Great
- **No password storage** in your backend.
- Firebase manages provider integrations.
- JWT can be verified by any backend language — Go, Node, Python, etc.
- Perfect for microservices — each service can independently verify tokens.

---
### 6. Firebase Setup — Step-by-Step (Zero Confusion)

We’ll start by setting up Firebase Authentication for our project.
#### Step 1: Create Firebase Project
1. Go to Firebase Console.
2. Click *“Add project”* → give it a name (e.g., `go-flutter-auth`).
3. Disable Google Analytics (optional).
4. Click **Create Project**.
#### Step 2: Enable Authentication Methods
1. In the left menu → **Authentication** → **Sign-in method**.
2. Enable:
    - **Email/Password**
    - (Optional) **Google Sign-In**
3. Save.

#### Step 3: Add Android App
1. In **Project settings** → **Your apps** → **Add app** → Android.
2. Enter:
    - Android package name (e.g., `com.example.authdemo`).
    - App nickname (optional).
3. Download the `google-services.json` file.
4. Place it in `android/app/` in your Flutter project.

#### Step 4: Add iOS App (Optional if building for iOS)
1. Register app in Firebase.
2. Download `GoogleService-Info.plist` and add it to `ios/Runner/`.

#### Step 5: Enable API Access for Backend
We need Firebase Admin credentials for the Go server:
1. Go to **Project Settings** → **Service accounts**.
2. Click **Generate new private key** → downloads JSON.
3. Store it securely (e.g., `firebase-admin.json`) — **never commit it to Git**.

📌 **Security Reminder:**  
The service account JSON is like a master key. Keep it safe.

---
### Flutter App — Authentication Implementation
We’ll use Flutter to:
- Sign up / Sign in.
- Retrieve Firebase JWT.
- Send JWT to Go backend.

#### Step 1: Add Dependencies
```yaml
dependencies:
  firebase_core: ^3.0.0
  firebase_auth: ^5.0.0
  http: ^1.1.0
```

#### Step 2: Initialise Firebase
`lib/main.dart`
```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart'; // generated by flutterfire cli

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Firebase Auth Demo',
      home: AuthScreen(),
    );
  }
}

```

#### Step 3: Sign Up/Sign In Screen
```dart
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

class AuthScreen extends StatefulWidget {
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final auth = FirebaseAuth.instance;

  Future<void> signUp() async {
    await auth.createUserWithEmailAndPassword(
      email: emailController.text,
      password: passwordController.text,
    );
  }

  Future<void> signIn() async {
    await auth.signInWithEmailAndPassword(
      email: emailController.text,
      password: passwordController.text,
    );
  }

  Future<void> sendToBackend() async {
    final token = await auth.currentUser!.getIdToken();
    final res = await http.get(
      Uri.parse('http://localhost:8080/protected'),
      headers: {'Authorization': 'Bearer $token'},
    );
    print(res.body);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Auth Demo')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(controller: emailController, decoration: const InputDecoration(labelText: 'Email')),
            TextField(controller: passwordController, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
            ElevatedButton(onPressed: signUp, child: const Text('Sign Up')),
            ElevatedButton(onPressed: signIn, child: const Text('Sign In')),
            ElevatedButton(onPressed: sendToBackend, child: const Text('Call Protected API')),
          ],
        ),
      ),
    );
  }
}

```

Note:
`getIdToken()` gets the latest Firebase JWT for the current user.

---
### 8. Go Backend — JWT Verification with Firebase Admin

Our Go server will:
- Accept requests with `Authorization: Bearer <token>`.
- Verify token with Firebase Admin SDK.
- Protect certain routes.

#### Step 1: Go Modules
```bash
go mod init github.com/example/go-firebase-auth
go get firebase.google.com/go/v4
go get github.com/gorilla/mux
```

#### Step 2: Server Code
`main.go`
```go
package main
import (
    "context"
    "fmt"
    "log"
    "net/http"
    "strings"

    firebase "firebase.google.com/go/v4"
    "github.com/gorilla/mux"
    "google.golang.org/api/option"
)

var app *firebase.App

func main() {
    ctx := context.Background()
    opt := option.WithCredentialsFile("firebase-admin.json")
    var err error
    app, err = firebase.NewApp(ctx, nil, opt)
    if err != nil {
        log.Fatalf("error initializing app: %v\n", err)
    }

    r := mux.NewRouter()
    r.HandleFunc("/protected", authMiddleware(protectedHandler))

    fmt.Println("Server running on :8080")
    log.Fatal(http.ListenAndServe(":8080", r))
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
            return
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
            return
        }

        ctx := context.Background()
        client, err := app.Auth(ctx)
        if err != nil {
            http.Error(w, "Failed to get Auth client", http.StatusInternalServerError)
            return
        }

        token, err := client.VerifyIDToken(ctx, parts[1])
        if err != nil {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }

        // Token verified, can read claims
        fmt.Printf("Authenticated user ID: %s\n", token.UID)

        // Pass to next handler
        next.ServeHTTP(w, r)
    }
}

func protectedHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintln(w, "You accessed a protected route!")
}

```

📌 **Explanation:**

- `VerifyIDToken()` Checks:
    - Signature is valid.
    - Token hasn’t expired.
    - Issuer matches our project.
- If valid → user is authenticated.

---
### 9. Custom Claims & Role-Based Access Control (RBAC)

Firebase lets us set **custom claims** to add roles to users.
Example: Mark user as admin.

```go
func setAdmin(uid string) {
    ctx := context.Background()
    client, _ := app.Auth(ctx)
    claims := map[string]interface{}{"role": "admin"}
    client.SetCustomUserClaims(ctx, uid, claims)
}
```

In Middleware:
```go
role := token.Claims["role"]
if role != "admin" {
    http.Error(w, "Forbidden", http.StatusForbidden)
    return
}
```

---
### 10. Token Expiry, Refresh, and Revocation

#### 0) The three token types you’ll hear about
- **ID Token (JWT)**: short-lived (~1 hour). What your Flutter app sends in the `Authorization: Bearer <id_token>` header to your Go API. Contains user identity claims (`uid`, `email`, `auth_time`, `exp`, etc.).
- **Refresh Token**: long-lived credential stored by the Firebase SDK on the client. Used to mint a fresh **ID token** silently. You don’t send this to your backend.
- **Session Cookie** (web-only alternative): server-managed cookie created from an ID token; not used in our Flutter (mobile) path, but good to know.

> Mental model: **ID token = boarding pass (expires soon)**, **Refresh token = ability to get a new boarding pass without re-checking in**.

#### 1) Expiry: what “expired” actually means
What’s inside the ID token
- `exp` — UNIX time when the token expires (≈ issued time + 1h).
- `iat` — issued-at time.
- `auth_time` — when the user last fully authenticated (useful for “recent login” checks).
- Other claims like `uid`, `email`, and custom claims (e.g., `role`).

#### Why it expires quickly
- Limits damage if a token leaks.
- Encourages frequent rotation 
- Makes revocation practical 

#### Backend behaviour (Go)
- If you only call `VerifyIDToken()`, Firebase Admin will validate **signature + expiration**.
- If the token is past `exp`, you’ll get **401**; the client should refresh and retry.

#### 2) Refresh: how the client silently keeps you signed in
How refresh works (behind the scenes)
1. User signs in (email/password, Google, etc.).
2. Firebase gives the client **two things**:
    - The current **ID token** (valid ~1 hour).
    - A **refresh token** (long-lived).
3. Before the ID token expires (or when the backend returns 401), the Firebase SDK uses the **refresh token** to get a **new ID token** — no password prompt.

> You never send the refresh token to your Go server. The SDK guards and uses it internally.

#### 3) Revocation: forcing sign-out across devices
Revocation is how you say: **“All existing credentials for this user are no longer valid — make them sign in again on every device.”**

**What revocation does:**
- It **invalidates refresh tokens** for the user (so the client can’t mint new ID tokens).
- It **retroactively invalidates existing ID tokens** (even if not expired) — **but only if your backend checks for revocation**.

> ⚠️ Important: `VerifyIDToken()` **does not** check revocation by default. You must call the “check revoked” variant.

 **When to revoke:**
- Suspicious activity or account takeover.
- User reports a lost device.
- Admin “force logout everywhere”.
- After sensitive profile changes (optional policy).

---
### 11. Security Best Practices
- Always use HTTPS.
- Store `firebase-admin.json` in a secure vault (not in repo).
- Validate all input on backend.
- Minimize token lifespan.
- Restrict Firebase API keys in console.