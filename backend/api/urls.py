# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, SongViewSet, GenreViewSet, LanguagesViewSet, LabelSongViewSet, DictionaryViewSet, AnnotationRequestViewSet, WordContributionViewSet

router = DefaultRouter()
router.register(r'user', UserViewSet)
router.register(r'song', SongViewSet, basename='song')
router.register(r'genre', GenreViewSet)
router.register(r'languages', LanguagesViewSet)
router.register(r'dictionary', DictionaryViewSet, basename='dictionary')
router.register(r'label-songs', LabelSongViewSet, basename='label-songs')
router.register(r'annotation-requests', AnnotationRequestViewSet, basename='annotation-requests')
router.register(r'word-contributions', WordContributionViewSet, basename='word-contributions')

urlpatterns = [
    path('', include(router.urls)),
]
