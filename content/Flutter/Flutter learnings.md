---
tags:
  - flutter
---
When you are in initState function of StateFul widget then we cautious of not doing anything that may be blocking runtime.  
initState is used to initialise things and it should be let run in non-blocking way otherwise it will cause error.  
anything that could be blocking if they are async call then they are thrown in another event loop so they are not blocking anymore.
