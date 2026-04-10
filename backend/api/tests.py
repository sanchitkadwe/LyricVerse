from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import LabelSong, Song


User = get_user_model()


class SongWorkflowTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            username="writer_one",
            password="testpass123",
            role="user",
        )
        self.other_user = User.objects.create_user(
            username="reader_two",
            password="testpass123",
            role="user",
        )

    def create_song(self, status_value="DRAFT"):
        return Song.objects.create(
            author=self.author,
            title="Midnight Rain",
            genre="indie",
            original_language="en",
            original_lyrics="Walking through the midnight rain",
            status=status_value,
        )

    def test_submit_then_final_publish_transitions_song(self):
        song = self.create_song()
        self.client.force_authenticate(user=self.author)

        submit_response = self.client.post(reverse("song-submit", args=[song.id]))

        self.assertEqual(submit_response.status_code, status.HTTP_200_OK)
        song.refresh_from_db()
        self.assertEqual(song.status, "PENDING")
        self.assertEqual(submit_response.data["status"], "PENDING")

        final_publish_response = self.client.post(reverse("song-final-publish", args=[song.id]))

        self.assertEqual(final_publish_response.status_code, status.HTTP_200_OK)
        song.refresh_from_db()
        self.assertEqual(song.status, "PUBLISHED")
        self.assertEqual(final_publish_response.data["status"], "PUBLISHED")

    def test_public_song_list_exposes_pending_and_published_only(self):
        draft_song = self.create_song(status_value="DRAFT")
        pending_song = self.create_song(status_value="PENDING")
        pending_song.title = "Open For Annotation"
        pending_song.save(update_fields=["title"])
        published_song = self.create_song(status_value="PUBLISHED")
        published_song.title = "Final Song"
        published_song.save(update_fields=["title"])

        response = self.client.get(reverse("song-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item["id"] for item in response.data}
        self.assertNotIn(draft_song.id, returned_ids)
        self.assertIn(pending_song.id, returned_ids)
        self.assertIn(published_song.id, returned_ids)

    def test_published_song_is_locked_from_author_edits(self):
        song = self.create_song(status_value="PUBLISHED")
        self.client.force_authenticate(user=self.author)

        response = self.client.patch(
            reverse("song-detail", args=[song.id]),
            {"title": "Changed Title"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        song.refresh_from_db()
        self.assertEqual(song.title, "Midnight Rain")


class FavoriteSongTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="listener_one",
            password="testpass123",
            role="user",
        )
        self.author = User.objects.create_user(
            username="writer_two",
            password="testpass123",
            role="user",
        )
        self.label_user = User.objects.create_user(
            username="label_house",
            password="testpass123",
            role="Music Label",
        )
        self.song = Song.objects.create(
            author=self.author,
            title="City Lights",
            genre="indie",
            original_language="en",
            original_lyrics="Streetlights shimmer in the rain",
            status="PUBLISHED",
        )
        self.label_song = LabelSong.objects.create(
            label_account=self.label_user,
            title="Official Anthem",
            artist="Studio Voice",
            genre="dance",
            original_language="hi",
            official_lyrics="Official hook line",
        )
        self.client.force_authenticate(user=self.user)

    def test_song_favorite_can_be_added_and_removed(self):
        add_response = self.client.post(reverse("song-favorite", args=[self.song.id]))
        self.assertEqual(add_response.status_code, status.HTTP_200_OK)
        self.assertTrue(add_response.data["is_favorite"])

        list_response = self.client.get(reverse("song-list"))
        favorite_state = next(item for item in list_response.data if item["id"] == self.song.id)
        self.assertTrue(favorite_state["is_favorite"])

        remove_response = self.client.delete(reverse("song-favorite", args=[self.song.id]))
        self.assertEqual(remove_response.status_code, status.HTTP_200_OK)
        self.assertFalse(remove_response.data["is_favorite"])

    def test_label_song_favorite_is_returned_in_profile_favorites(self):
        add_response = self.client.post(reverse("label-songs-favorite", args=[self.label_song.id]))
        self.assertEqual(add_response.status_code, status.HTTP_200_OK)
        self.assertTrue(add_response.data["is_favorite"])

        favorites_response = self.client.get(reverse("user-favorites"))
        self.assertEqual(favorites_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(favorites_response.data), 1)
        favorite = favorites_response.data[0]
        self.assertEqual(favorite["song_title"], "Official Anthem")
        self.assertTrue(favorite["is_label_song"])
        self.assertEqual(favorite["route"], f"/label-song/{self.label_song.id}")

    def test_song_like_endpoint_increments_likes(self):
        self.assertEqual(self.song.likes, 0)

        response = self.client.post(reverse("song-like", args=[self.song.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.song.refresh_from_db()
        self.assertEqual(self.song.likes, 1)
        self.assertEqual(response.data["likes"], 1)
