**Instagram Clone**
A mini Instagram-style social media application built with Python Flask backend and vanilla JavaScript frontend.

**# Features**
User Authentication
User signup with email, username, and password
Password hashing using bcrypt for security
Token-based session management

**# Social Features**
Follow System: Users can follow and unfollow other users
Posts: Create posts with image URLs and captions
Likes: Like and unlike posts
Feed: Personalized feed showing posts from followed users only
User Profiles: View user profiles with post grid, follower/following counts

**# Tech Stack**

**1. Backend**
Python 3.x
Flask - Web framework
Flask-SQLAlchemy - ORM for database operations
Flask-JWT-Extended - JWT token authentication
Flask-Bcrypt - Password hashing
Flask-CORS - Cross-origin resource sharing
SQLite - Database

**2. Frontend**
HTML5
CSS3
Vanilla JavaScript (ES6+)
Fetch API for HTTP requests


**# Database Schema**

**1. Users Table**
id (Primary Key)
username (Unique)
email (Unique)
password (Hashed)
created_at

**2. Posts Table**
id (Primary Key)
image_url
caption
user_id (Foreign Key → Users)
created_at


**# Relationships**
Followers (Many-to-Many): Users ↔ Users
Likes (Many-to-Many): Users ↔ Posts

**# Installation & Setup**

**1. Prerequisites**
Python 3.7 or higher
pip (Python package manager)

**2. Backend Setup**
Clone or download the project
bash   cd instagram-clone/backend
Create a virtual environment
bash   python -m venv venv
Activate the virtual environment

**3. Install dependencies**
bash   pip install flask flask-cors flask-jwt-extended flask-bcrypt flask-sqlalchemy
Run the Flask server
bash   python app.py
The backend will run on http://localhost:5000

**4. Frontend Setup**
Navigate to frontend folder
bash   cd instagram-clone/frontend
Start a simple HTTP server
bash   python -m http.server 8000
Open your browser
Go to: http://localhost:8000

**# Usage Guide**
1. Create an Account

Open the application
Click "Sign up"
Enter username, email, and password
You'll be automatically logged in

2. Create Posts

Click "Create Post" in the navigation
Enter an image URL (use free services like Unsplash or Picsum)

Example: https://picsum.photos/400/400

Add a caption (optional)
Click "Post"

3. Follow Users

To see posts in your feed, you need to follow other users
Create multiple accounts in different browser tabs
Visit user profiles and click "Follow"


**Security Notes**
*Do NOT use in production without:*
Changing the JWT secret key in app.py
Implementing proper password requirements
Setting up HTTPS
Implementing rate limiting
Using environment variables for secrets

Note: This application uses SQLite for simplicity. For production use, consider PostgreSQL or MySQL.
