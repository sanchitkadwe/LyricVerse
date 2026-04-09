from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import check_password, make_password
from django.db.models import Q
from .models import User, Song, Genre, Languages, LabelSong, Dictionary
from .serializers import UserSerializer, SongSerializer, GenreSerializer, LanguagesSerializer, LabelSongSerializer, LabelSongDetailSerializer, DictionarySerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    # By default, endpoints require the user to be logged in
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        user = request.user 
        
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        elif request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def signup(self, request):
        
        first_name = request.data.get("first_name", "firstName")
        last_name = request.data.get("last_name", "lastName")
        username = request.data.get("username")
        password = request.data.get("password")
        email = request.data.get("email", "")  # Optional
        preferred_language = request.data.get("preferred_language", "en")
        bio = request.data.get("bio", "")        
        role = "user"

        if not all([username, password]):
            return Response({"error": "Username and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "User with this username already exists"}, status=status.HTTP_400_BAD_REQUEST)

        hashed_password = make_password(password)

        try:
            user = User.objects.create(
                first_name=first_name,
                last_name=last_name,
                username=username,
                password=hashed_password,
                email=email,
                preferred_language=preferred_language,
                role=role,
                bio=bio
            )
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        try:
            user = User.objects.get(username=username)

            if not check_password(password, user.password):
                return Response({"error": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
             
                response = Response({
                    "message": "Login successful!",
                    "role": user.role, 
                    "username": user.username
                }, status=status.HTTP_200_OK)
                
                response.set_cookie(
                    key='access_token',
                    value=access_token,
                    httponly=True,
                    secure=False,  # Set to True in Production (HTTPS)
                    samesite='Lax',
                    path='/'
                )
                
                response.set_cookie(
                    key='refresh_token',
                    value=str(refresh),
                    httponly=True,
                    secure=False,  # Set to True in Production (HTTPS)
                    samesite='Lax',
                    path='/',
                )

                return response

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        response = Response({"message": "Logout successful!"}, status=status.HTTP_200_OK)
        
        response.delete_cookie('access_token', path='/')
        response.delete_cookie('refresh_token', path='/')
        return response
    


class SongViewSet(viewsets.ModelViewSet):
    serializer_class = SongSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.request.user
        base_queryset = Song.objects.select_related('author').order_by('-created_at')

        if self.action in ['create', 'update', 'partial_update', 'destroy', 'submit', 'final_publish']:
            if not user.is_authenticated:
                return Song.objects.none()
            if user.role == 'verifier':
                return base_queryset
            return base_queryset.filter(author=user)

        if not user.is_authenticated:
            return base_queryset.filter(status__in=['PENDING', 'PUBLISHED'])

        if user.role == 'verifier':
            return base_queryset
            
        return base_queryset.filter(Q(status__in=['PENDING', 'PUBLISHED']) | Q(author=user)).distinct()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        song = self.get_object()

        if song.status == 'PUBLISHED':
            raise ValidationError({"error": "Published songs are locked and cannot be edited."})

        serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def mine(self, request):
        user_songs = Song.objects.filter(author=request.user).order_by('-created_at')
        serializer = self.get_serializer(user_songs, many=True)
        return Response(serializer.data)


    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        song = self.get_object()

        if song.author != request.user:
            return Response({"error": "You can only submit your own songs."}, status=status.HTTP_403_FORBIDDEN)
            
        if song.status != 'DRAFT':
            return Response({"error": "Only draft songs can be opened for community annotation."}, status=status.HTTP_400_BAD_REQUEST)

        song.status = 'PENDING'
        song.save()
        serializer = self.get_serializer(song)
        return Response({
            "message": "Song is now open for community annotation.",
            "status": song.status,
            "song": serializer.data,
        })

    @action(detail=True, methods=['post'])
    def final_publish(self, request, pk=None):
        song = self.get_object()

        if song.author != request.user:
            return Response({"error": "You can only final publish your own songs."}, status=status.HTTP_403_FORBIDDEN)

        if song.status != 'PENDING':
            return Response({"error": "Only songs in the annotation stage can be finally published."}, status=status.HTTP_400_BAD_REQUEST)

        song.status = 'PUBLISHED'
        song.save()
        serializer = self.get_serializer(song)
        return Response({
            "message": f"'{song.title}' is now finally published and locked for editing.",
            "status": song.status,
            "song": serializer.data,
        })

    @action(detail=False, methods=['get'])
    def pending(self, request):
        if request.user.role != 'verifier':
            return Response({"error": "Only verifiers can view the pending queue."}, status=status.HTTP_403_FORBIDDEN)
            
        pending_songs = Song.objects.filter(status='PENDING').order_by('created_at')
        serializer = self.get_serializer(pending_songs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        song = self.get_object()

        if request.user.role != 'verifier':
            return Response({"error": "Only verifiers can approve songs."}, status=status.HTTP_403_FORBIDDEN)

        if song.status != 'PENDING':
            return Response({"error": "Only pending songs can be approved."}, status=status.HTTP_400_BAD_REQUEST)

        song.status = 'PUBLISHED'
        song.save()
        return Response({"message": f"'{song.title}' has been published!"})
    


class GenreViewSet(viewsets.ModelViewSet):
        queryset = Genre.objects.all()
        serializer_class = GenreSerializer
        http_method_names = ['get']

class LanguagesViewSet(viewsets.ModelViewSet):
        queryset = Languages.objects.all()
        serializer_class = LanguagesSerializer
        http_method_names = ['get']


class DictionaryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Dictionary.objects.all().order_by('word')
    serializer_class = DictionarySerializer
    http_method_names = ['get']


class LabelSongViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LabelSongSerializer
    # permission_classes = [IsAuthenticated]
    http_method_names = ['get']
    queryset = LabelSong.objects.select_related('label_account').all().order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LabelSongDetailSerializer
        return LabelSongSerializer
