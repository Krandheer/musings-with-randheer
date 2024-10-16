---
tags:
  - "#django"
  - sql
  - form-valiation
---

### Django queries in sql formats

To see Django queries in sql format we can use

```python
python manage.py shell_plus --print-sql
```

Now whatever query we do in python we can see sql of that, this command comes from django-extensions and not by default from Django.

Another way to achieve the same things is using Django script, using the command

```python
python manage.py runscript script-name
```

This command also comes from django-extension.
So now we can write our Django query and also print connection.queries to see the sql query.

for example

```python
from django.db import connection
query1 = some_django_model.objects.all()
print(query1)
print(connection.queries)
```

In this way can always see what Django ORM is executing behind the scene and knowing this internal we can write more optimal Django queries to speed up our application.

### Order by queries

When we do Django order by query and we use the key as something which is string, then in that case we may see wrong result because of lower/upper casing of key.

for example

```python
result = some_model.objects.order_by("name")
```

This query could give wrong result on basis of casing of name.

To resolve this Django offers db inbuilt function so that query when transformed to sql does the lower/upper casing of name field and then returns the result on basis of that.

Example:

```python
from django.db.models.functions import Lower
result = some_model.objects.order_by(Lower("name"))
```

### Django N+1 queries problem

Let's understand what is N+1 queries problem

suppose we have following table:

```python
class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=100)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)
```

And we want to display all others and their books.
For that we write the following query

```python
authors = Author.objects.all()
for author in authors:
    print(author.name)
    for book in author.book_set.all():
        print(book.title)
```

Now we will get one sql query for first line and then n query for book.title making total query to n+1.
This can make our application slow and unnecessary increase the number of queries.

To solve this Django provides two methods:

- prefetch_related
- select_related

#### select_related() Method:

This method is used for single-value relationship (ForeignKey, One-To-One) or one to one or one to many lookup queries. It performs sql join and includes the fields of the related object in select statement.

When to use: Use `select_related` when you know you'll need to access the related object and it's a single-valued relationship.

Example:

```python
books = Book.objects.all()
for book in books:
    print(f"{book.title} - by {book.author.name}")
```

This query will result in additional queries for each author.

```python
books = Book.objects.select_related('author')
for book in books:
    print(f"{book.title} - by {book.author.name}")
```

This perform single query with joins, fetching all necessary data at once.

#### prefetch_related() Method:

This method is used for many to many or many to one lookup queries.
It performs a separate lookup for each relationship and does the joining in python.

When to use: Use `prefetch_related` when you need to access many related objects or when dealing with many-to-many relationships.

Example:
without prefetch_related:

```python
authors = Author.objects.all()
for author in authors:
    print(author.name)
    for book in author.book_set.all():
        print(book.title)
```

This would result in N+1 queries.

with prefetch_related:

```python
authors = Author.objects.prefetch_related('book_set')
for author in authors:
    print(author.name)
    for book in author.book_set.all():
        print(book.title)
```

This performs two queries:

- one to fetch all authors
- one to fetch all the books for those authors

Like select_related prefetch related doesn't do join in sql itself because then it will lead in many redundant data.

Each author would be repeated for books they have written.

This could significantly increase the number of row returned, specifically for the author who has written multiple books.

#### only() Method:

select_related() does the join of tables and in join it selects all the field from the tables which may make query large in terms of memory.

To optimise this we can use .only method and pass it the fields that we want.
This way the converted sql from our query will select fields only passed in .only method from join table.

While using only() method we should be very cautious about using only those fields that are passed inside only() method, otherwise Django will do extra queries which will defeat the purpose of using select_related().

So use only() method when you really need to optimise your application to this level otherwise you may be good without using it too.

### Django form validations

If we want to implement form validation on any field in Django model, then while defining the model we can pass list of validation function to validators while defining the field.

for example:

```python
field1 = Models.TextField(max_length=245, validators=[validation_function])
```

Now when this models is used in modelform then when user submits the data these validation are done before saving or further processing of data. If validation is not satisfied then a good error message is shown to user.

Caveats is that these validators does nothing if not used in modelform or data is created by using model directly. If you are directly using the model to create the data then instead of using .create() method use .save() method and before saving data call .full_clean() method on the object itself.

Example:

```python
object1 = some_model(field1=field1, field2=field2)
try:
	object1.full_clean()
except ValidationError as e:
	print(e.message_dict)
object1.save()
```

To read more see this: [[Django internals part 2]]
