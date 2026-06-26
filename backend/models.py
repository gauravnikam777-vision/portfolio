"""
Database Models
All SQLAlchemy models for the AI Portfolio application.
Kept separate from app.py for clean architecture and easier testing.
"""

from datetime import datetime, timezone
from extensions import db


class Contact(db.Model):
    """Contact form submissions."""
    __tablename__ = 'contacts'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    ip_address = db.Column(db.String(64))
    user_agent = db.Column(db.Text)
    status = db.Column(db.String(20), default='new')  # new, read, replied, archived
    read = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'status': self.status,
            'read': self.read,
        }


class Project(db.Model):
    """AI / Data projects showcased on the portfolio."""
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), index=True)
    technologies = db.Column(db.JSON, default=list)
    impact = db.Column(db.String(255))
    status = db.Column(db.String(20), default='completed')
    github_url = db.Column(db.String(255))
    demo_url = db.Column(db.String(255))
    display_order = db.Column(db.Integer, default=0)
    featured = db.Column(db.Boolean, default=True)
    image_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'technologies': self.technologies or [],
            'impact': self.impact,
            'status': self.status,
            'github_url': self.github_url,
            'demo_url': self.demo_url,
            'display_order': self.display_order,
            'featured': self.featured,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Skill(db.Model):
    """Tech-stack skills grouped by category."""
    __tablename__ = 'skills'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=False, index=True)
    level = db.Column(db.String(20), default='Advanced')  # Beginner/Intermediate/Advanced/Expert
    proficiency = db.Column(db.Integer, default=80)  # 0-100 for progress bar
    icon = db.Column(db.String(10), default='⚡')
    display_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'level': self.level,
            'proficiency': self.proficiency,
            'icon': self.icon,
        }


class Education(db.Model):
    """Education timeline entries."""
    __tablename__ = 'education'

    id = db.Column(db.Integer, primary_key=True)
    degree = db.Column(db.String(255), nullable=False)
    institution = db.Column(db.String(255), nullable=False)
    year_range = db.Column(db.String(50))
    description = db.Column(db.Text)
    display_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'degree': self.degree,
            'institution': self.institution,
            'year_range': self.year_range,
            'description': self.description,
        }


class Certification(db.Model):
    """Professional certifications."""
    __tablename__ = 'certifications'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    issuer = db.Column(db.String(255), nullable=False)
    year = db.Column(db.String(10))
    credential_url = db.Column(db.String(255))
    display_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'issuer': self.issuer,
            'year': self.year,
            'credential_url': self.credential_url,
        }


class Testimonial(db.Model):
    """Endorsements / testimonials."""
    __tablename__ = 'testimonials'

    id = db.Column(db.Integer, primary_key=True)
    quote = db.Column(db.Text, nullable=False)
    author_name = db.Column(db.String(255), nullable=False)
    author_title = db.Column(db.String(255))
    avatar_initial = db.Column(db.String(4), default='?')
    display_order = db.Column(db.Integer, default=0)
    approved = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'quote': self.quote,
            'author_name': self.author_name,
            'author_title': self.author_title,
            'avatar_initial': self.avatar_initial,
            'approved': self.approved,
            'display_order': self.display_order,
        }


class Experience(db.Model):
    """Work experience / professional timeline entries."""
    __tablename__ = 'experience'

    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(255), default='')
    start_date = db.Column(db.String(20), nullable=False)   # e.g. "Jan 2023"
    end_date = db.Column(db.String(20), default='Present')  # e.g. "Dec 2024" or "Present"
    description = db.Column(db.Text, default='')
    technologies = db.Column(db.JSON, default=list)
    display_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role,
            'company': self.company,
            'location': self.location,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'description': self.description,
            'technologies': self.technologies or [],
            'display_order': self.display_order,
        }


class BlogPost(db.Model):
    """Blog / articles section entries."""
    __tablename__ = 'blog_posts'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    summary = db.Column(db.String(500), default='')
    content = db.Column(db.Text, default='')
    tags = db.Column(db.JSON, default=list)
    published = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self, include_content=False):
        d = {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'summary': self.summary,
            'tags': self.tags or [],
            'published': self.published,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_content:
            d['content'] = self.content
        return d


class SiteProfile(db.Model):
    """Single-row table storing the owner's profile information."""
    __tablename__ = 'site_profile'

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(255), default='Gaurav Nikam')
    job_title = db.Column(db.String(255), default='Data Analyst | AI/ML Engineer')
    tagline = db.Column(db.String(500), default='Turning raw data into decisions that matter')
    bio = db.Column(db.Text, default='')
    location = db.Column(db.String(255), default='Pune, Maharashtra, India')
    email = db.Column(db.String(255), default='gauravnikam072@gmail.com')
    phone = db.Column(db.String(50), default='+91 8669212675')
    github_url = db.Column(db.String(255), default='https://github.com/gauravnikam777-vision')
    linkedin_url = db.Column(db.String(255), default='https://www.linkedin.com/in/gaurav-nikam-44842a345')
    twitter_url = db.Column(db.String(255), default='')
    website_url = db.Column(db.String(255), default='')
    telegram_url = db.Column(db.String(255), default='https://t.me/gauravnikam')
    whatsapp_url = db.Column(db.String(255), default='https://wa.me/918669212675')
    instagram_url = db.Column(db.String(255), default='https://instagram.com/gauravnikam89')
    facebook_url = db.Column(db.String(255), default='https://facebook.com/gauravnikam')
    kaggle_url = db.Column(db.String(255), default='https://kaggle.com/gauravnikam')
    leetcode_url = db.Column(db.String(255), default='https://leetcode.com/u/gauravnikam777-vision/')
    availability_status = db.Column(db.String(100), default='Open to opportunities')
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'job_title': self.job_title,
            'tagline': self.tagline,
            'bio': self.bio,
            'location': self.location,
            'email': self.email,
            'phone': self.phone,
            'github_url': self.github_url,
            'linkedin_url': self.linkedin_url,
            'twitter_url': self.twitter_url,
            'website_url': self.website_url,
            'telegram_url': self.telegram_url,
            'whatsapp_url': self.whatsapp_url,
            'instagram_url': self.instagram_url,
            'facebook_url': self.facebook_url,
            'kaggle_url': self.kaggle_url,
            'leetcode_url': self.leetcode_url,
            'availability_status': self.availability_status,
        }


class AnalyticsEvent(db.Model):
    """Lightweight page-view / event analytics (no auth required to write)."""
    __tablename__ = 'analytics_events'

    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(100), index=True)
    page = db.Column(db.String(255))
    ip_address = db.Column(db.String(64))
    user_agent = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    meta = db.Column(db.JSON, default=dict)

    def to_dict(self):
        return {
            'id': self.id,
            'event_type': self.event_type,
            'page': self.page,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
        }





