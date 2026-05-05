#async-await
Promise starts running as soon as it created, await is not needed for starting the promise, await resolves the promises.

And when you do await and then that function itself in which await is called is suspended for the moment and main thread is free to handle anything else, until event loop reschedule this suspended function.


While it might seem counterintuitive that `await` makes code faster, it's not about making a single operation faster. Instead, it's about making your _program_ more efficient by preventing it from getting stuck while waiting for something to happen. The key to this is the **event loop**.

Let's break this down in detail with an example.

[async-await](https://chatgpt.com/c/68befcaa-da54-8333-9823-d4f0701fb5a8)

### The Problem: Blocking Code

Imagine you have a function that needs to do two things:

1. Fetch some data from a slow API (let's say it takes 5 seconds).
    
2. Perform a CPU-intensive calculation (let's say it takes 2 seconds).
    

If you write this code synchronously (without `async/await`), it would look something like this:

```typescript
function getApiDataSync() {
  console.log('1. Starting API fetch...');
  // Simulating a 5-second API call
  const startTime = Date.now();
  while (Date.now() - startTime < 5000) {
    // This is a blocking loop! The program is stuck here.
  }
  console.log('2. API fetch finished.');
  return { data: 'some data' };
}

function doHeavyCalculationSync() {
  console.log('3. Starting heavy calculation...');
  // Simulating a 2-second heavy calculation
  const startTime = Date.now();
  while (Date.now() - startTime < 2000) {
    // This is also a blocking loop!
  }
  console.log('4. Heavy calculation finished.');
  return 'some result';
}

function runSynchronousCode() {
  console.log('Program start...');
  getApiDataSync(); // This blocks for 5 seconds
  doHeavyCalculationSync(); // This blocks for 2 seconds
  console.log('Program end.');
}

runSynchronousCode();
```

When you run this, here's what happens:

- The program starts.
    
- It calls `getApiDataSync()`.
    
- The entire program **freezes** for 5 seconds while it's waiting for the "API" to respond. No other code can run, no user interface can update, no other events can be processed.
    
- After 5 seconds, the API call returns.
    
- The program then calls `doHeavyCalculationSync()`.
    
- The program **freezes again** for 2 seconds.
    
- After 2 seconds, the calculation is done.
    
- The program finishes.
    

The total time for this synchronous operation is `5s + 2s = 7s`.

### The Solution: Non-Blocking I/O with the Event Loop

The event loop is a core concept in JavaScript's concurrency model. It's not a separate thread, but a mechanism that allows the single-threaded JavaScript engine to handle multiple tasks efficiently. It constantly checks two things:

1. The **call stack**: This is where the code that's currently being executed lives.
    
2. The **callback queue** (or task queue): This is where functions (callbacks) that are ready to be executed are placed.
    

Now let's rewrite the previous example using `async/await`.

### The Example with `async/await`

```typescript
function getApiDataAsync(): Promise<object> {
  console.log('1. Starting API fetch...');
  return new Promise(resolve => {
    // This is a non-blocking operation
    setTimeout(() => {
      console.log('2. API fetch finished.');
      resolve({ data: 'some data' });
    }, 5000); // Wait for 5 seconds
  });
}

function doHeavyCalculationAsync(): Promise<string> {
  console.log('3. Starting heavy calculation...');
  // Note: For a true CPU-intensive task, this would still be blocking.
  // We use setTimeout here to demonstrate non-blocking I/O.
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('4. Heavy calculation finished.');
      resolve('some result');
    }, 2000); // Wait for 2 seconds
  });
}

async function runAsynchronousCode() {
  console.log('Program start...');
  
  // Create two promises, but don't await them yet.
  const apiPromise = getApiDataAsync();
  const calcPromise = doHeavyCalculationAsync();

  // Now, we await the results.
  const apiResult = await apiPromise; // The 'await' pauses the function here.
  const calcResult = await calcPromise; // The second 'await' pauses here.

  console.log('API Result:', apiResult);
  console.log('Calculation Result:', calcResult);

  console.log('Program end.');
}

runAsynchronousCode();
```

Let's trace what happens with the event loop:

1. **`runAsynchronousCode()` is called.** It's put on the call stack.
    
2. **`getApiDataAsync()` is called.** It returns a `Promise`. Inside, `setTimeout` is called. The `setTimeout` function is a non-blocking API. The JavaScript engine hands off the 5-second timer to the underlying system (e.g., the browser or Node.js runtime) and immediately moves on. The `getApiDataAsync` function finishes and its `Promise` is returned.
    
3. **`doHeavyCalculationAsync()` is called.** Same as above, it returns a `Promise`. The `setTimeout` is handed off to the runtime, and the function returns immediately.
    
4. **`await apiPromise;` is encountered.** The JavaScript engine sees the `await` keyword. It knows that the `apiPromise` is not yet resolved.
    
    - **Crucially, instead of blocking, the `runAsynchronousCode()` function is PAUSED.** It is removed from the call stack. The control is given back to the event loop.
        
    - The event loop is now free to check for other things. For example, it can handle user clicks, render a UI, or execute other code.
        
5. **The Event Loop is "working."** The timers for both the API call (5s) and the calculation (2s) are running in the background. After 2 seconds, the `doHeavyCalculationAsync`'s `setTimeout` timer finishes. Its callback (`resolve('some result')`) is pushed into the **callback queue**.
    
6. **After 5 seconds**, the `getApiDataAsync`'s `setTimeout` timer finishes. Its callback (`resolve({ data: 'some data' })`) is also pushed into the **callback queue**.
    
7. The event loop constantly checks if the call stack is empty. When it becomes empty (as `runAsynchronousCode` was paused), it looks at the callback queue.
    
8. It sees the callback from the calculation is ready. It pushes this callback onto the call stack and executes it. This resolves the `calcPromise`.
    
9. Then it sees the callback from the API fetch is ready. It pushes this callback onto the call stack and executes it. This resolves the `apiPromise`.
    
10. **The `await` magic happens.** The event loop sees that the `apiPromise` that was awaited is now resolved. It resumes the `runAsynchronousCode()` function, putting it back on the call stack at the line right after the `await`.
    
11. The code continues. It assigns `apiResult` and then hits `await calcPromise;`.
    
12. The `calcPromise` is **already resolved**. The `await` doesn't pause at all. It immediately gets the result.
    
13. The rest of the function executes.
    

### Why It's Faster (and What You're Missing)

Your confusion comes from the "waiting" part. You're right that `await` makes the _function_ wait. But it does **not** make the _program_ wait.

Here's the key difference:

- **Synchronous `while` loop:** The CPU is actively doing work (spinning) for 5 seconds. Nothing else can happen. This is a **busy wait**.
    
- **`async/await` and Event Loop:** The `await` keyword effectively tells the JavaScript engine, "I need to wait for this, but while I'm waiting, you can go and do other things." The CPU is **free** to work on other tasks. This is a **non-blocking wait**.
    

The real power isn't about the total time for a single sequence of operations. The real power is in **concurrency**.

Let's modify the example slightly to show true speed-up:

```typescript
async function runConcurrentCode() {
  console.log('Program start...');
  
  // Start both operations at the same time!
  const apiPromise = getApiDataAsync(); // Starts the 5-second timer
  const calcPromise = doHeavyCalculationAsync(); // Starts the 2-second timer

  // Use Promise.all to wait for both to finish.
  const [apiResult, calcResult] = await Promise.all([apiPromise, calcPromise]);
  
  console.log('API Result:', apiResult);
  console.log('Calculation Result:', calcResult);
  
  console.log('Program end.');
}

runConcurrentCode();
```

While it might seem counterintuitive that `await` makes code faster, it's not about making a single operation faster. Instead, it's about making your _program_ more efficient by preventing it from getting stuck while waiting for something to happen. The key to this is the **event loop**.

Let's break this down in detail with an example.

### The Problem: Blocking Code

Imagine you have a function that needs to do two things:

1. Fetch some data from a slow API (let's say it takes 5 seconds).
    
2. Perform a CPU-intensive calculation (let's say it takes 2 seconds).
    

If you write this code synchronously (without `async/await`), it would look something like this:

TypeScript

```
function getApiDataSync() {
  console.log('1. Starting API fetch...');
  // Simulating a 5-second API call
  const startTime = Date.now();
  while (Date.now() - startTime < 5000) {
    // This is a blocking loop! The program is stuck here.
  }
  console.log('2. API fetch finished.');
  return { data: 'some data' };
}

function doHeavyCalculationSync() {
  console.log('3. Starting heavy calculation...');
  // Simulating a 2-second heavy calculation
  const startTime = Date.now();
  while (Date.now() - startTime < 2000) {
    // This is also a blocking loop!
  }
  console.log('4. Heavy calculation finished.');
  return 'some result';
}

function runSynchronousCode() {
  console.log('Program start...');
  getApiDataSync(); // This blocks for 5 seconds
  doHeavyCalculationSync(); // This blocks for 2 seconds
  console.log('Program end.');
}

runSynchronousCode();
```

When you run this, here's what happens:

- The program starts.
    
- It calls `getApiDataSync()`.
    
- The entire program **freezes** for 5 seconds while it's waiting for the "API" to respond. No other code can run, no user interface can update, no other events can be processed.
    
- After 5 seconds, the API call returns.
    
- The program then calls `doHeavyCalculationSync()`.
    
- The program **freezes again** for 2 seconds.
    
- After 2 seconds, the calculation is done.
    
- The program finishes.
    

The total time for this synchronous operation is `5s + 2s = 7s`.

### The Solution: Non-Blocking I/O with the Event Loop

The event loop is a core concept in JavaScript's concurrency model. It's not a separate thread, but a mechanism that allows the single-threaded JavaScript engine to handle multiple tasks efficiently. It constantly checks two things:

1. The **call stack**: This is where the code that's currently being executed lives.
    
2. The **callback queue** (or task queue): This is where functions (callbacks) that are ready to be executed are placed.
    

Now let's rewrite the previous example using `async/await`.

### The Example with `async/await`

TypeScript

```
function getApiDataAsync(): Promise<object> {
  console.log('1. Starting API fetch...');
  return new Promise(resolve => {
    // This is a non-blocking operation
    setTimeout(() => {
      console.log('2. API fetch finished.');
      resolve({ data: 'some data' });
    }, 5000); // Wait for 5 seconds
  });
}

function doHeavyCalculationAsync(): Promise<string> {
  console.log('3. Starting heavy calculation...');
  // Note: For a true CPU-intensive task, this would still be blocking.
  // We use setTimeout here to demonstrate non-blocking I/O.
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('4. Heavy calculation finished.');
      resolve('some result');
    }, 2000); // Wait for 2 seconds
  });
}

async function runAsynchronousCode() {
  console.log('Program start...');
  
  // Create two promises, but don't await them yet.
  const apiPromise = getApiDataAsync();
  const calcPromise = doHeavyCalculationAsync();

  // Now, we await the results.
  const apiResult = await apiPromise; // The 'await' pauses the function here.
  const calcResult = await calcPromise; // The second 'await' pauses here.

  console.log('API Result:', apiResult);
  console.log('Calculation Result:', calcResult);

  console.log('Program end.');
}

runAsynchronousCode();
```

Let's trace what happens with the event loop:

1. **`runAsynchronousCode()` is called.** It's put on the call stack.
    
2. **`getApiDataAsync()` is called.** It returns a `Promise`. Inside, `setTimeout` is called. The `setTimeout` function is a non-blocking API. The JavaScript engine hands off the 5-second timer to the underlying system (e.g., the browser or Node.js runtime) and immediately moves on. The `getApiDataAsync` function finishes and its `Promise` is returned.
    
3. **`doHeavyCalculationAsync()` is called.** Same as above, it returns a `Promise`. The `setTimeout` is handed off to the runtime, and the function returns immediately.
    
4. **`await apiPromise;` is encountered.** The JavaScript engine sees the `await` keyword. It knows that the `apiPromise` is not yet resolved.
    
    - **Crucially, instead of blocking, the `runAsynchronousCode()` function is PAUSED.** It is removed from the call stack. The control is given back to the event loop.
        
    - The event loop is now free to check for other things. For example, it can handle user clicks, render a UI, or execute other code.
        
5. **The Event Loop is "working."** The timers for both the API call (5s) and the calculation (2s) are running in the background. After 2 seconds, the `doHeavyCalculationAsync`'s `setTimeout` timer finishes. Its callback (`resolve('some result')`) is pushed into the **callback queue**.
    
6. **After 5 seconds**, the `getApiDataAsync`'s `setTimeout` timer finishes. Its callback (`resolve({ data: 'some data' })`) is also pushed into the **callback queue**.
    
7. The event loop constantly checks if the call stack is empty. When it becomes empty (as `runAsynchronousCode` was paused), it looks at the callback queue.
    
8. It sees the callback from the calculation is ready. It pushes this callback onto the call stack and executes it. This resolves the `calcPromise`.
    
9. Then it sees the callback from the API fetch is ready. It pushes this callback onto the call stack and executes it. This resolves the `apiPromise`.
    
10. **The `await` magic happens.** The event loop sees that the `apiPromise` that was awaited is now resolved. It resumes the `runAsynchronousCode()` function, putting it back on the call stack at the line right after the `await`.
    
11. The code continues. It assigns `apiResult` and then hits `await calcPromise;`.
    
12. The `calcPromise` is **already resolved**. The `await` doesn't pause at all. It immediately gets the result.
    
13. The rest of the function executes.
    

### Why It's Faster (and What You're Missing)

Your confusion comes from the "waiting" part. You're right that `await` makes the _function_ wait. But it does **not** make the _program_ wait.

Here's the key difference:

- **Synchronous `while` loop:** The CPU is actively doing work (spinning) for 5 seconds. Nothing else can happen. This is a **busy wait**.
    
- **`async/await` and Event Loop:** The `await` keyword effectively tells the JavaScript engine, "I need to wait for this, but while I'm waiting, you can go and do other things." The CPU is **free** to work on other tasks. This is a **non-blocking wait**.
    

The real power isn't about the total time for a single sequence of operations. The real power is in **concurrency**.

Let's modify the example slightly to show true speed-up:

TypeScript

```
async function runConcurrentCode() {
  console.log('Program start...');
  
  // Start both operations at the same time!
  const apiPromise = getApiDataAsync(); // Starts the 5-second timer
  const calcPromise = doHeavyCalculationAsync(); // Starts the 2-second timer

  // Use Promise.all to wait for both to finish.
  const [apiResult, calcResult] = await Promise.all([apiPromise, calcPromise]);
  
  console.log('API Result:', apiResult);
  console.log('Calculation Result:', calcResult);
  
  console.log('Program end.');
}

runConcurrentCode();
```

In this version:

- `getApiDataAsync()` and `doHeavyCalculationAsync()` are started almost instantly.
    
- The timers run in the background.
    
- The `Promise.all` waits until **the last promise resolves**, which is the 5-second API call.
    
- The 2-second calculation finishes first, but the program is still waiting for the API.
    
- The total execution time is only **5 seconds**, not 7. The 2-second calculation was performed "in parallel" with the first 2 seconds of the API call.
    

This is the essence of why `async/await` is faster and more efficient: it allows your program to handle multiple non-blocking I/O operations concurrently, preventing the entire application from freezing while waiting for a single slow task.


[Chat link](https://gemini.google.com/app/bdc76c034619d38d)

if you need declaration merging then only use interface otherwise types does the task and is more flexible then interface. [Chat link](https://chatgpt.com/c/693fdf3b-b31c-8321-b000-2f978ccdbd40)


00 = 0
11 = 0
01=1
10=1
