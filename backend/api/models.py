from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db.models import Q

# Custom User model to extend Django's built-in user with additional fields
class User(AbstractUser):

    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('hi', 'Hindi'),
        ('mr', 'Marathi'),
        ('ta', 'Tamil'),
        ('bn', 'Bengali'),
    ]

    ROLE_CHOICES = [
        ('user', 'User'),
        ('Music Label', 'Label'),
    ]

    Rating = [1, 2, 3, 4, 5]

    preferred_language = models.CharField(
        max_length=10,
        choices=LANGUAGE_CHOICES,
        default='en'
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='user'
    )

    bio = models.TextField(blank=True, null=True)
    rating = models.FloatField(blank=True, null=True, choices=[(i, i) for i in Rating])
    

    def __str__(self):
        return f"{self.username} ({self.role})"
    
class Genre(models.Model):

    GENRE_CHOICES = BOLLYWOOD_GENRE_CHOICES = [
        ('romantic', 'Romantic'),
        ('dance', 'Dance / Party'),
        ('sad', 'Sad / Emotional'),
        ('item', 'Item Song'),
        ('qawwali', 'Qawwali'),
        ('ghazal', 'Ghazal'),
        ('classical', 'Classical'),
        ('folk', 'Folk'),
        ('patriotic', 'Patriotic'),
        ('devotional', 'Devotional'),
        ('rap', 'Rap / Hip-Hop'),
        ('remix', 'Remix'),
        ('sufi', 'Sufi'),
        ('indie', 'Indie / Non-Film'),
    ]    
    name = models.CharField(
        max_length=20,
        choices=BOLLYWOOD_GENRE_CHOICES,
        default='romantic'
    )

    def __str__(self):
        return self.name

class Languages(models.Model):
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('hi', 'Hindi'),
        ('mr', 'Marathi'),
        ('ta', 'Tamil'),
        ('bn', 'Bengali'),
    ]
    name = models.CharField(
        max_length=10,
        choices=LANGUAGE_CHOICES,
        default='en'
    )

    def __str__(self):
        return self.name    
class Song(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending'),
        ('PUBLISHED', 'Published'),
    ]
    Rating =[1,2,3,4,5]

    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='songs')
    title = models.CharField(max_length=200)
    rating = models.FloatField(choices=[(i, i) for i in Rating], blank=True, null=True)
    genre = models.CharField(max_length=15, blank=True, choices= Genre.GENRE_CHOICES)
    original_language = models.CharField(max_length=50, blank=False, null=False, default='English', choices=User.LANGUAGE_CHOICES)
    original_lyrics = models.TextField(blank=True)
    likes =  models.IntegerField(default=0)
    audio_file = models.FileField(upload_to='audio/', blank=True, null=True)
    tts_audio_file = models.FileField(upload_to='tts/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')

    def __str__(self):
        return self.title
    

    

    
    
class LabelSong(models.Model):
    # Links to the label who uploaded it
    Rating =[1,2,3,4,5]
    label_account = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='label_songs',blank=False,null=False)
    
    title = models.CharField(max_length=200,blank=False)
    artist = models.CharField(max_length=200)
    movie = models.CharField(max_length=200, blank=True)
    rating = models.FloatField(choices=[(i, i) for i in Rating], blank=True, null=True)
    genre = models.CharField(max_length=50, blank=True, choices=Genre.GENRE_CHOICES)
    original_language = models.CharField(max_length=50, default='English', choices=User.LANGUAGE_CHOICES)
    
    # One simple text field for the official lyrics. No line-by-line database rows needed!
    likes =  models.IntegerField(default=0)
    audio_file = models.FileField(upload_to='audio/', blank=True, null=True)
    tts_audio_file = models.FileField(upload_to='tts/', blank=True, null=True)
    official_lyrics = models.TextField() 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} (Official Label Release)"

class FavoriteSong(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorite_songs',
    )
    song = models.ForeignKey(
        Song,
        on_delete=models.CASCADE,
        related_name='favorite_entries',
        null=True,
        blank=True,
    )
    label_song = models.ForeignKey(
        LabelSong,
        on_delete=models.CASCADE,
        related_name='favorite_entries',
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=(
                    (Q(song__isnull=False) & Q(label_song__isnull=True))
                    | (Q(song__isnull=True) & Q(label_song__isnull=False))
                ),
                name='favorite_song_exactly_one_target',
            ),
            models.UniqueConstraint(
                fields=['user', 'song'],
                condition=Q(song__isnull=False),
                name='unique_user_song_favorite',
            ),
            models.UniqueConstraint(
                fields=['user', 'label_song'],
                condition=Q(label_song__isnull=False),
                name='unique_user_label_song_favorite',
            ),
        ]

    def __str__(self):
        target_title = self.song.title if self.song_id else self.label_song.title
        return f"{self.user.username} favorited {target_title}"


class Dictionary(models.Model):

    word = models.CharField(max_length=25, unique=True)
    language = models.CharField(
        choices=Languages.LANGUAGE_CHOICES
    )
    meaning = models.TextField(max_length=50)

    def __str__(self):
        return f"{self.word} ({self.get_language_display()})"
    

class TranslatedLyrics(models.Model):
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name='lyrics')
    english_lyrics= models.TextField()
    hindi_lyrics = models.TextField()
    marathi_lyrics = models.TextField()
    tamil_lyrics = models.TextField()
    bengali_lyrics = models.TextField()
    def __str__(self):
        return f"{self.song.title} - Translated Lyrics"
    



class AnnotationRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('partially_accepted', 'Partially Accepted'),
        ('rejected', 'Rejected'),
    ]

    song = models.ForeignKey(
        Song,
        on_delete=models.CASCADE,
        related_name='annotation_requests'
    )
    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='annotation_requests'
    )
    proposed_lyrics = models.TextField()
    note = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Annotation by {self.contributor.username} on '{self.song.title}' [{self.status}]"
