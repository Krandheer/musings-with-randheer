---
title: Golang Nuances
tags:
  - Golang
---

### Query params
Suppose you are writing a get API, and you chose query params as a way to get data in your backend request.  
Now in golang you can get the query params data in two ways.  
For example suppose the query params we expecting is `page`.  
First way to parse the query params is

```Golang
func someFunction(w http.ResponseWriter, r *http.Request) {
    page := r.FormValue("page")
}
```

Since we are using `Form` keyword the confusion arises, is query params treated as Form value?.

So the interesting thing here is that r.FormValue internally calls r.ParseForm() if you have not called, and in that way it first try to parse for form and it works for both get and post request.  
So if you have form in your get request and query params also with same key as `page` then it will parse the value for form but not query params Because it only gets the first value for the key it is looking for.  
And if you don't have any form then it will look for key in query params.

The second method is:
```Golang
func someFunction(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query() //this line will get all query params
	page := queryParams['page']
}
```
This method explicitly is for getting query params. It gets all the value associated with page keyword even if the values are multiples.

key to remember:
In get request if there is any from submitted then form values becomes query params.


### Pointers in Golang

Go makes pointers a lot easier to deal with than C/C++. You don’t have to worry about constantly writing `*` to dereference values — the compiler handles that for you when accessing struct fields or calling methods. It keeps pointers powerful but much less painful.

