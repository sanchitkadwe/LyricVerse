from django.contrib import admin
from api.models import Song, User, LabelSong, Genre, Languages, Dictionary, TranslatedLyrics, AnnotationRequest


# Register your models here.
admin.site.register(User)
admin.site.register(Song)
admin.site.register(LabelSong)
admin.site.register(Genre)
admin.site.register(Languages)
admin.site.register(Dictionary)
admin.site.register(TranslatedLyrics)
admin.site.register(AnnotationRequest)
