Redis:
In memory, key-value based database.  
Can be used as cache, distributed lock, pub-sub, message-queue, and key-value in memory storage.

Difference between redis and kafka as pub-sub is that in redis there must be some subscriber listening to producer otherwise data will be lost.  
but in kafka there subscriber could wait and come later data will be there pub-sub.
