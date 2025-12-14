from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from datetime import timedelta
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models import db, User, Post, Comment

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instagram.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-this'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
db.init_app(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)


with app.app_context():
    db.create_all()

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        user = User(
            username=data['username'],
            email=data['email'],
            password=hashed_password
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=user.id)
        
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 201
    except Exception as e:
        print(f"Signup error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not bcrypt.check_password_hash(user.password, data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401

        token = create_access_token(identity=user.id)
        
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 200
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts', methods=['POST'])
@jwt_required()
def create_post():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        print(f"Creating post for user {user_id}: {data}")
        post = Post(
            image_url=data['image_url'],
            caption=data.get('caption', ''),
            user_id=user_id
        )
        db.session.add(post)
        db.session.commit()
        return jsonify({
            'id': post.id,
            'image_url': post.image_url,
            'caption': post.caption,
            'created_at': post.created_at.isoformat()
        }), 201
    except Exception as e:
        print(f"Create post error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<int:post_id>', methods=['GET'])
@jwt_required()
def get_post(post_id):
    try:
        post = Post.query.get_or_404(post_id)
        user_id = get_jwt_identity()
        
        return jsonify({
            'id': post.id,
            'image_url': post.image_url,
            'caption': post.caption,
            'created_at': post.created_at.isoformat(),
            'author': {
                'id': post.author.id,
                'username': post.author.username
            },
            'likes_count': len(post.liked_by),
            'is_liked': any(u.id == user_id for u in post.liked_by),
            'comments': [{
                'id': c.id,
                'text': c.text,
                'author': c.author.username,
                'created_at': c.created_at.isoformat()
            } for c in post.comments]
        }), 200
    except Exception as e:
        print(f"Get post error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/feed', methods=['GET'])
@jwt_required()
def get_feed():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        following_ids = [u.id for u in user.following.all()]
        
        if not following_ids:
            return jsonify([]), 200
        
        posts = Post.query.filter(Post.user_id.in_(following_ids)).order_by(Post.created_at.desc()).all()
        
        return jsonify([{
            'id': post.id,
            'image_url': post.image_url,
            'caption': post.caption,
            'created_at': post.created_at.isoformat(),
            'author': {
                'id': post.author.id,
                'username': post.author.username
            },
            'likes_count': len(post.liked_by),
            'is_liked': any(u.id == user_id for u in post.liked_by),
            'comments_count': len(post.comments)
        } for post in posts]), 200
    except Exception as e:
        print(f"Feed error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def like_post(post_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        post = Post.query.get_or_404(post_id)
        
        if user not in post.liked_by:
            post.liked_by.append(user)
            db.session.commit()
        
        return jsonify({'message': 'Post liked', 'likes_count': len(post.liked_by)}), 200
    except Exception as e:
        print(f"Like error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<int:post_id>/unlike', methods=['POST'])
@jwt_required()
def unlike_post(post_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        post = Post.query.get_or_404(post_id)
        
        if user in post.liked_by:
            post.liked_by.remove(user)
            db.session.commit()
        
        return jsonify({'message': 'Post unliked', 'likes_count': len(post.liked_by)}), 200
    except Exception as e:
        print(f"Unlike error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        comment = Comment(
            text=data['text'],
            user_id=user_id,
            post_id=post_id
        )
        
        db.session.add(comment)
        db.session.commit()
        
        return jsonify({
            'id': comment.id,
            'text': comment.text,
            'author': comment.author.username,
            'created_at': comment.created_at.isoformat()
        }), 201
    except Exception as e:
        print(f"Comment error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>/follow', methods=['POST'])
@jwt_required()
def follow_user(user_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        user_to_follow = User.query.get_or_404(user_id)
        
        if user_to_follow not in current_user.following.all():
            current_user.following.append(user_to_follow)
            db.session.commit()
        
        return jsonify({'message': 'User followed'}), 200
    except Exception as e:
        print(f"Follow error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>/unfollow', methods=['POST'])
@jwt_required()
def unfollow_user(user_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        user_to_unfollow = User.query.get_or_404(user_id)
        
        if user_to_unfollow in current_user.following.all():
            current_user.following.remove(user_to_unfollow)
            db.session.commit()
        
        return jsonify({'message': 'User unfollowed'}), 200
    except Exception as e:
        print(f"Unfollow error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        user = User.query.get_or_404(user_id)
        
        return jsonify({
            'id': user.id,
            'username': user.username,
            'posts_count': len(user.posts),
            'followers_count': user.followers.count(),
            'following_count': user.following.count(),
            'is_following': user in current_user.following.all(),
            'posts': [{
                'id': p.id,
                'image_url': p.image_url,
                'likes_count': len(p.liked_by)
            } for p in user.posts]
        }), 200
    except Exception as e:
        print(f"Profile error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email
        }), 200
    except Exception as e:
        print(f"Get current user error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
