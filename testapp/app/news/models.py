from django.db import models
from django.contrib.auth.models import User
from tinymce.models import HTMLField
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericRelation
from baton.fields import BatonAiImageField

class Activity(models.Model):
    FAVORITE = 'F'
    LIKE = 'L'
    UP_VOTE = 'U'
    DOWN_VOTE = 'D'
    ACTIVITY_TYPES = (
        (FAVORITE, 'Favorite'),
        (LIKE, 'Like'),
        (UP_VOTE, 'Up Vote'),
        (DOWN_VOTE, 'Down Vote'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=1, choices=ACTIVITY_TYPES)
    date = models.DateTimeField(auto_now_add=True)
    image = BatonAiImageField(upload_to='activity/img', alt_field='image_alt', subject_location_field='image_subject_location', null=True, blank=True)
    image_alt = models.CharField('image alt', max_length=50, blank=True, null=True)
    image_subject_location = models.CharField('image subject location', max_length=7, blank=True, null=True, default='50,50')

    # Below the mandatory fields for generic relation
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey()

    class Meta:
        verbose_name = "activity"
        verbose_name_plural = "activities"


class Category(models.Model):
    name = models.CharField('name', max_length=50)

    class Meta:
        verbose_name = "category"
        verbose_name_plural = "categories"

    def __str__(self):
        return "{0}".format(self.name)


class News(models.Model):
    class Status(models.IntegerChoices):
        DRAFT = 1, "draft"
        REVIEWED = 2, "reviewed"
        READY = 3, "ready"
        ARCHIVED = 4, "archived"

    category = models.ForeignKey(
        Category,
        verbose_name='category',
        on_delete=models.CASCADE,
        related_name='news',
    )
    date = models.DateField('date')
    datetime = models.DateTimeField('datetime', blank=True, null=True, help_text='insert date')
    title = models.CharField('title', max_length=50, help_text='please insert a cool title')
    link = models.URLField('link', blank=True, null=True)
    image = BatonAiImageField(upload_to='news/img', alt_field='image_alt', subject_location_field='image_subject_location', null=True, blank=True)
    image_alt = models.CharField('image alt', max_length=50, blank=True, null=True)
    image_subject_location = models.CharField('image subject location', max_length=7, blank=True, null=True, default='50,50')
    content = HTMLField(verbose_name='content', help_text='html is supported')
    summary = HTMLField('summary', blank=True, null=True)
    share = models.BooleanField(default=False)
    published = models.BooleanField(default=False)
    attachments_summary = models.TextField('attachments summary', blank=True)
    videos_summary = models.TextField('videos summary', blank=True)
    favorites = GenericRelation(Activity)
    status = models.IntegerField(choices=Status.choices, blank=True, null=True)

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
    author_email = models.EmailField(blank=True, null=True)

    class Meta:
        verbose_name = "video"
        verbose_name_plural = "videos"

    def __str__(self):
        return '{0}'.format(self.caption)
