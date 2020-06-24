from django.db import models
from filer.fields.image import FilerImageField


class Category(models.Model):
    name = models.CharField('name', max_length=50)

    class Meta:
        verbose_name = "category"
        verbose_name_plural = "categories"

    def __str__(self):
        return "{0}".format(self.name)


class News(models.Model):
    category = models.ForeignKey(
        Category,
        verbose_name='category',
        on_delete=models.CASCADE,
        related_name='news',
    )
    date = models.DateField('date')
    datetime = models.DateTimeField('datetime', blank=True, null=True, help_text='insert date')
    title = models.CharField('title', max_length=50, help_text='please insert a cool title')
    image = FilerImageField(null=True, blank=True, on_delete=models.SET_NULL, related_name="news_image")
    content = models.TextField('content', help_text='html is supported')
    share = models.BooleanField(default=False)
    published = models.BooleanField(default=False)
    attachments_summary = models.TextField('attachments summary', blank=True)
    videos_summary = models.TextField('videos summary', blank=True)

    class Meta:
        verbose_name = "news"
        verbose_name_plural = "news"

    def __str__(self):
        return '{0}'.format(self.title)


class Attachment(models.Model):
    news = models.ForeignKey(
        News,
        verbose_name='news',
        on_delete=models.CASCADE,
        related_name='attachments',
    )
    file = models.FileField(upload_to='news/img')
    caption = models.TextField()

    class Meta:
        verbose_name = "attachment"
        verbose_name_plural = "attachments"

    def __str__(self):
        return '{0}'.format(self.caption)


class Video(models.Model):
    news = models.ForeignKey(
        News,
        verbose_name='news',
        on_delete=models.CASCADE,
        related_name='videos',
    )
    code = models.CharField('video code', max_length=50)
    caption = models.TextField()

    class Meta:
        verbose_name = "video"
        verbose_name_plural = "videos"

    def __str__(self):
        return '{0}'.format(self.caption)
