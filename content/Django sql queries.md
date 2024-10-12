To see Django queries in sql format we can use 
```python
python manage.py shell_plus --print-sql
```
Now whatever query we do in python we can see sql of that, this command comes from django-extensions and not in default way.

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