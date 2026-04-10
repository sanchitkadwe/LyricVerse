from rest_framework import serializers
from .models import User, Song, Languages, Genre, LabelSong, Dictionary, AnnotationRequest 

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


class DictionarySerializer(serializers.ModelSerializer):
    language_display = serializers.CharField(source='get_language_display', read_only=True)

    class Meta:
        model = Dictionary
        fields = ['id', 'word', 'language', 'language_display', 'meaning']

class SongSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')
    genre_display = serializers.CharField(source='get_genre_display', read_only=True)
    original_language_display = serializers.CharField(source='get_original_language_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    can_annotate = serializers.SerializerMethodField()
    is_editable = serializers.SerializerMethodField()
    owner_type = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = [
            'id',
            'title',
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
            'author',
            'author_username'
        ]
        # These fields cannot be modified directly via standard POST/PUT requests
        read_only_fields = ['author', 'created_at', 'status']

    def get_can_annotate(self, obj):
        return obj.status == 'PENDING'

    def get_is_editable(self, obj):
        return obj.status != 'PUBLISHED'

    def get_owner_type(self, obj):
        return 'Independent Songwriters'


class LabelSongSerializer(serializers.ModelSerializer):
    label_account_username = serializers.ReadOnlyField(source='label_account.username')
    genre_display = serializers.CharField(source='get_genre_display', read_only=True)
    original_language_display = serializers.CharField(source='get_original_language_display', read_only=True)

    class Meta:
        model = LabelSong
        fields = [
            'id',
            'title',
            'artist',
            'movie',
            'rating',
            'genre',
            'genre_display',
            'original_language',
            'original_language_display',
            # 'official_lyrics',
            # 'created_at',
            'label_account',
            'label_account_username',
        ]
        read_only_fields = ['label_account', 'created_at']


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