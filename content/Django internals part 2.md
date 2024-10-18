### Content type
what if you want to write a general query in Django just like a function which take some argument and then perform some action.
This is where contenttypes model/app shines in Django.

This app comes pre-installed with Django in Django settings.

The purpose of this application (contenttypes) is to track all other models install in your project.

suppose you have app named core and a model inside it as Account, then after migration you will get a entry in contentype table as app_label = core, and model = account.

For example I have an app as core and model inside it as restaurant and not this is how contenttype table create by contenttype model inside contenttypes app given by default from Django will look like.

| id  | app_label    | model       |
| --- | ------------ | ----------- |
| 1   | admin        | logentry    |
| 2   | auth         | permission  |
| 3   | auth         | group       |
| 4   | auth         | user        |
| 5   | contenttypes | contenttype |
| 6   | sessions     | session     |
| 7   | core         | restaurant  |

To see objects of contenttype model we can perform normal Django ORM query.
for example 

```python
from django.contrib.contenttypes.models import ContentType
content_type = ContentType.objects.all()
print(content_type)

<QuerySet [<ContentType: admin | log entry>, <ContentType: auth | permission>, <ContentType: auth | group>, <ContentType: auth | user>, <ContentType: contenttypes | content type>, <ContentType: sessions | session>, <ContentType: core | restaurant>, <ContentType: core | rating>, <ContentType: core | sale>, <ContentType: core | order>, <ContentType: core | product>]>
```
Now since we know that contenttype has app_label and model as it's one of the field (refer to table screenshot)

we can perform following query:

```python
content_type = ContentType.objects.get(app_label='core', model='restaurant')  
app_model = content_type.model_class()  
all_objects = app_model.objects.all()  
print(all_objects)

<QuerySet [<Restaurant: Pizzeria 1>, <Restaurant: Pizzeria 2>, <Restaurant: Golden Dragon>, <Restaurant: Bombay Bustle>, <Restaurant: McDonalds>, <Restaurant: Taco Bell>, <Restaurant: Chinese 2>, <Restaurant: Chinese 3>, <Restaurant: Indian 2>, <Restaurant: Mexican 1>, <Restaurant: Mexican 2>, <Restaurant: Pizzeria 3>, <Restaurant: Pizzeria 4>, <Restaurant: Italian 1>]>

```

now the query we wrote we can encapsulate that and just pass the model and class name and this same query will get executed on those model.

So basically in this way we can encapsulate a query to be performed repeatedly on different app and model.

