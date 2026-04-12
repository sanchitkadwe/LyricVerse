from rest_framework import serializers
from .models import User, Song, Languages, Genre, LabelSong, Dictionary, AnnotationRequest, FavoriteSong, WordContribution, SavedWord

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'rating', 'preferred_language', 'email', 'bio', 'role']

class LanguagesSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(source='get_name_display')

    class Meta:
        model = Languages
        fields = ['name','display_name']

class GenreSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(source='get_name_display')
    class Meta:
        model = Genre
        fields = ['display_name','name']


class WordContributionSerializer(serializers.ModelSerializer):
    contributor_username = serializers.ReadOnlyField(source='contributor.username')

    class Meta:
        model = WordContribution
        fields = ['id', 'dictionary', 'contributor', 'contributor_username', 'meaning', 'cultural_context', 'upvotes', 'created_at']
        read_only_fields = ['contributor', 'upvotes', 'created_at']


class DictionarySerializer(serializers.ModelSerializer):
    language_display = serializers.CharField(source='get_language_display', read_only=True)
    contributions_count = serializers.IntegerField(source='contributions.count', read_only=True)
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Dictionary
        fields = ['id', 'word', 'language', 'language_display', 'meaning', 'contributions_count', 'is_saved']

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.saved_by.filter(user=request.user).exists()

class SongSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')
    genre_display = serializers.CharField(source='get_genre_display', read_only=True)
    original_language_display = serializers.CharField(source='get_original_language_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    can_annotate = serializers.SerializerMethodField()
    is_editable = serializers.SerializerMethodField()
    owner_type = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = [
            'id',
            'title',
            'likes',
            'audio_file',
            'tts_audio_file',
            'rating',
            'genre',
            'genre_display',
            'original_language',
            'original_language_display',
            'original_lyrics',
            'created_at',
            'status',
            'status_display',
            'can_annotate',
            'is_editable',
            'owner_type',
            'is_favorite',
            'author',
            'author_username'
        ]
        read_only_fields = ['author', 'created_at', 'status']

    def get_can_annotate(self, obj):
        return obj.status == 'PENDING'

    def get_is_editable(self, obj):
        return obj.status != 'PUBLISHED'

    def get_owner_type(self, obj):
        return 'Independent Songwriters'

    def get_is_favorite(self, obj):
        user = self.context.get('request').user
        if not user or not user.is_authenticated:
            return False
        if hasattr(obj, 'request_user_favorites'):
            return bool(obj.request_user_favorites)
        return obj.favorite_entries.filter(user=user).exists()


class LabelSongSerializer(serializers.ModelSerializer):
    label_account_username = serializers.ReadOnlyField(source='label_account.username')
    genre_display = serializers.CharField(source='get_genre_display', read_only=True)
    original_language_display = serializers.CharField(source='get_original_language_display', read_only=True)
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = LabelSong
        fields = [
            'id',
            'title',
            'artist',
            'movie',
            'likes',
            'audio_file',
            'tts_audio_file',
            'rating',
            'genre',
            'genre_display',
            'original_language',
            'original_language_display',
            'is_favorite',
            'label_account',
            'label_account_username',
        ]
        read_only_fields = ['label_account', 'created_at']

    def get_is_favorite(self, obj):
        user = self.context.get('request').user
        if not user or not user.is_authenticated:
            return False
        if hasattr(obj, 'request_user_favorites'):
            return bool(obj.request_user_favorites)
        return obj.favorite_entries.filter(user=user).exists()


class LabelSongDetailSerializer(LabelSongSerializer):
    class Meta(LabelSongSerializer.Meta):
        fields = LabelSongSerializer.Meta.fields + [
            'official_lyrics',
            'created_at',
        ]



class AnnotationRequestSerializer(serializers.ModelSerializer):
    contributor_username = serializers.ReadOnlyField(source='contributor.username')
    song_title = serializers.ReadOnlyField(source='song.title')
    song_author = serializers.ReadOnlyField(source='song.author.id')

    class Meta:
        model = AnnotationRequest
        fields = [
            'id',
            'song',
            'song_title',
            'song_author',
            'contributor',
            'contributor_username',
            'proposed_lyrics',
            'note',
            'status',
            'created_at',
            'reviewed_at',
        ]
        read_only_fields = [
            'contributor', 'status', 'created_at', 'reviewed_at',
            'song_title', 'song_author',
        ]


class FavoriteSongSerializer(serializers.ModelSerializer):
    song_title = serializers.SerializerMethodField()
    artist_name = serializers.SerializerMethodField()
    genre = serializers.SerializerMethodField()
    genre_display = serializers.SerializerMethodField()
    original_language = serializers.SerializerMethodField()
    original_language_display = serializers.SerializerMethodField()
    owner_type = serializers.SerializerMethodField()
    route = serializers.SerializerMethodField()
    source_id = serializers.SerializerMethodField()
    is_label_song = serializers.SerializerMethodField()

    class Meta:
        model = FavoriteSong
        fields = [
            'id',
            'created_at',
            'song',
            'label_song',
            'song_title',
            'artist_name',
            'genre',
            'genre_display',
            'original_language',
            'original_language_display',
            'owner_type',
            'route',
            'source_id',
            'is_label_song',
        ]

    def _target(self, obj):
        return obj.label_song if obj.label_song_id else obj.song

    def get_song_title(self, obj):
        return self._target(obj).title

    def get_artist_name(self, obj):
        target = self._target(obj)
        if obj.label_song_id:
            return target.artist
        return target.author.username

    def get_genre(self, obj):
        return self._target(obj).genre

    def get_genre_display(self, obj):
        return self._target(obj).get_genre_display()

    def get_original_language(self, obj):
        return self._target(obj).original_language

    def get_original_language_display(self, obj):
        return self._target(obj).get_original_language_display()

    def get_owner_type(self, obj):
        return 'Label Verified' if obj.label_song_id else 'Independent Songwriters'

    def get_route(self, obj):
        target = self._target(obj)
        return f"/label-song/{target.id}" if obj.label_song_id else f"/song/{target.id}"

    def get_source_id(self, obj):
        return self._target(obj).id

    def get_is_label_song(self, obj):
        return bool(obj.label_song_id)
