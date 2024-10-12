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
python manage.py runscripts script-name
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

### Django form validations
If we want to implement form validation on any field in Django model, then while defining the model we can pass list of validation function to validators while defining the field.

for example:
```python
field1 = Models.TextField(max_length=245, validators=[validation_function])
```
Now when this models is used in modelform then when user submits the data these validation or done before saving or further processing of data. If validation is not satisfied and good error message is shown in front-end.

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

