"""
AI Portfolio — Flask Application Factory
Serves the static frontend AND a JSON API from a single process, so
there is no nginx/static-folder mismatch like in the previous version.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import re
import io
import logging
import uuid
from datetime import datetime, timedelta, timezone
import threading

from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS

from config import get_config
from extensions import db, migrate, limiter

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger(__name__)

STATIC_FOLDER = os.path.join(os.path.dirname(__file__), 'static')

# Thread lock and initialization tracking to prevent SQLite concurrency issues on Vercel
db_init_lock = threading.Lock()
db_initialized = False


def create_app():
    app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path='')
    app.config.from_object(get_config())

    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}},
        supports_credentials=False,
    )

    # Import models so Flask-Migrate can see them.
    import models  # noqa: F401

    # ── Fallback profile data (used when DB is unreachable) ─────────
    FALLBACK_PROFILE = {
        'id': 0,
        'full_name': 'Gaurav Nikam',
        'job_title': 'Data Analyst | AI/ML Engineer',
        'tagline': 'Turning raw data into decisions that matter',
        'bio': ('Aspiring Data Analyst and MCA student with hands-on experience in SQL, Python, Power BI, '
                'Tableau, and machine learning — building end-to-end analytics that drive real business outcomes.'),
        'location': 'Pune, Maharashtra, India',
        'email': 'gauravnikam072@gmail.com',
        'phone': '+91 8669212675',
        'github_url': 'https://github.com/gauravnikam777-vision',
        'linkedin_url': 'https://www.linkedin.com/in/gaurav-nikam-44842a345',
        'twitter_url': '',
        'website_url': '',
        'telegram_url': 'https://t.me/gauravnikam',
        'whatsapp_url': 'https://wa.me/918669212675',
        'instagram_url': 'https://instagram.com/gauravnikam89',
        'facebook_url': 'https://facebook.com/gauravnikam',
        'kaggle_url': 'https://kaggle.com/gauravnikam',
        'leetcode_url': 'https://leetcode.com/u/gauravnikam777-vision/',
        'availability_status': 'Open to opportunities',
    }

    def _ensure_db():
        """Ensure database tables exist and are seeded. Safe to call multiple times."""
        global db_initialized
        if db_initialized:
            return

        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if db_uri.startswith('sqlite:///'):
            db_path = db_uri.replace('sqlite:///', '')
            # If the database file is non-empty, we can assume it's already initialized and seeded.
            if os.path.exists(db_path) and os.path.getsize(db_path) > 0:
                db_initialized = True
                return

        with db_init_lock:
            if db_initialized:
                return
            if db_uri.startswith('sqlite:///'):
                db_path = db_uri.replace('sqlite:///', '')
                if os.path.exists(db_path) and os.path.getsize(db_path) > 0:
                    db_initialized = True
                    return

            try:
                db.create_all()
                from models import Project
                if not Project.query.first():
                    logger.info("Database is empty. Running auto-seed...")
                    from seed_db import PROJECTS, SKILLS, EDUCATION, CERTIFICATIONS, TESTIMONIALS
                    from models import Skill, Education, Certification, Testimonial, SiteProfile
                    
                    for p in PROJECTS:
                        db.session.add(Project(**p))
                    for category, name, level, proficiency, icon in SKILLS:
                        db.session.add(Skill(category=category, name=name, level=level,
                                              proficiency=proficiency, icon=icon))
                    for e in EDUCATION:
                        db.session.add(Education(**e))
                    for c in CERTIFICATIONS:
                        db.session.add(Certification(**c))
                    for t in TESTIMONIALS:
                        db.session.add(Testimonial(**t))
                    
                    if not SiteProfile.query.first():
                        db.session.add(SiteProfile(**{k: v for k, v in FALLBACK_PROFILE.items() if k != 'id'}))
                    
                    db.session.commit()
                    logger.info("Auto-seed completed successfully.")
                db_initialized = True
            except Exception as ex:
                db.session.rollback()
                logger.error(f"Auto-seed / db creation failed: {ex}")

    with app.app_context():
        _ensure_db()

    # On Vercel, the DB might not survive between invocations.
    # Ensure it's initialized on every request.
    @app.before_request
    def ensure_db_before_request():
        if os.getenv('VERCEL'):
            _ensure_db()

    from utils import cleaner
    from email_service import EmailService
    import json

    email_service = EmailService(app.config)

    # ------------------------------------------------------------------
    # Static frontend
    # ------------------------------------------------------------------
    @app.route('/')
    def index():
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/admin')
    def admin_panel():
        return send_from_directory(app.static_folder, 'admin.html')

    @app.route('/<path:path>')
    def static_proxy(path):
        """Serve any static asset; fall back to index.html for unknown
        client-side routes instead of a raw 404 (nice for direct links
        to #sections, and future client-side routing)."""
        full_path = os.path.join(app.static_folder, path)
        if os.path.isfile(full_path):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    # ------------------------------------------------------------------
    # Health & meta
    # ------------------------------------------------------------------
    @app.route('/api/health')
    def health():
        db_ok = True
        db_error = None
        try:
            db.session.execute(db.text('SELECT 1'))
        except Exception as e:
            db_ok = False
            db_error = str(e)
            logger.error(f"DB health check failed: {e}")

        # Debug info for Vercel troubleshooting
        debug = {
            'db_uri': str(app.config.get('SQLALCHEMY_DATABASE_URI', ''))[:80],
            'is_vercel': bool(os.getenv('VERCEL')),
            'tmp_exists': os.path.isdir('/tmp') if os.name != 'nt' else 'N/A (Windows)',
            'engine_options': str(app.config.get('SQLALCHEMY_ENGINE_OPTIONS', {})),
        }
        if db_error:
            debug['db_error'] = db_error[:200]

        return jsonify({
            'status': 'ok' if db_ok else 'degraded',
            'database': 'ok' if db_ok else 'unreachable',
            'features': {
                'email_enabled': app.config['EMAIL_ENABLED'],
            },
            'debug': debug,
            'timestamp': datetime.now(timezone.utc).isoformat() + 'Z',
            'version': '2.0.0',
        })

    # ------------------------------------------------------------------
    # Content endpoints (DB-backed, with safe empty-list fallback so the
    # frontend never crashes even before `seed_db.py` has been run)
    # ------------------------------------------------------------------
    @app.route('/api/projects')
    def get_projects():
        try:
            from models import Project
            projects = Project.query.filter_by(featured=True).order_by(Project.display_order, Project.id).all()
            return jsonify([p.to_dict() for p in projects])
        except Exception:
            return jsonify([])

    @app.route('/api/skills')
    def get_skills():
        try:
            from models import Skill
            skills = Skill.query.order_by(Skill.category, Skill.display_order).all()
            grouped = {}
            for s in skills:
                grouped.setdefault(s.category, []).append(s.to_dict())
            return jsonify(grouped)
        except Exception:
            return jsonify({})

    @app.route('/api/education')
    def get_education():
        try:
            from models import Education
            items = Education.query.order_by(Education.display_order).all()
            return jsonify([e.to_dict() for e in items])
        except Exception:
            return jsonify([])

    @app.route('/api/certifications')
    def get_certifications():
        try:
            from models import Certification
            items = Certification.query.order_by(Certification.display_order).all()
            return jsonify([c.to_dict() for c in items])
        except Exception:
            return jsonify([])

    @app.route('/api/testimonials')
    def get_testimonials():
        try:
            from models import Testimonial
            items = Testimonial.query.filter_by(approved=True).order_by(Testimonial.display_order).all()
            return jsonify([t.to_dict() for t in items])
        except Exception:
            return jsonify([])

    @app.route('/api/resume')
    def download_resume():
        """Serve a static resume file if present; otherwise 404 with a
        clear message instead of a silent failure."""
        resume_path = os.path.join(app.static_folder, 'resume.pdf')
        if not os.path.isfile(resume_path):
            return jsonify({'error': 'Resume file not uploaded yet. '
                                      'Place resume.pdf in backend/static/'}), 404
        return send_from_directory(app.static_folder, 'resume.pdf', as_attachment=True,
                                    download_name='Gaurav_Nikam_Resume.pdf')

    # ------------------------------------------------------------------
    # Contact form
    # ------------------------------------------------------------------
    @app.route('/api/contact', methods=['POST'])
    @limiter.limit('5 per hour')
    def submit_contact():
        from models import Contact
        data = request.get_json(silent=True) or {}

        name = cleaner.strip_html((data.get('name') or '').strip())
        email = (data.get('email') or '').strip()
        message = cleaner.strip_html((data.get('message') or '').strip())

        if not (name and email and message):
            return jsonify({'error': 'name, email, and message are all required'}), 400
        if not _is_valid_email(email):
            return jsonify({'error': 'Please provide a valid email address'}), 400
        if len(message) > 5000:
            return jsonify({'error': 'Message is too long (max 5000 characters)'}), 400

        contact = Contact(
            name=name[:255],
            email=email[:255],
            message=message,
            ip_address=request.headers.get('X-Forwarded-For', request.remote_addr),
            user_agent=request.headers.get('User-Agent', '')[:1000],
        )
        db.session.add(contact)
        db.session.commit()

        try:
            email_service.notify_owner_of_contact(name, email, message)
            email_service.send_confirmation_to_visitor(name, email)
        except Exception as e:
            logger.error(f"Email notification failed (contact still saved): {e}")

        return jsonify({'success': True, 'message': 'Message received — thank you!', 'id': contact.id}), 201

    # ------------------------------------------------------------------
    # No AI/ML playback endpoints are exposed in this version.
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # Analytics — PUBLIC write endpoint (no auth, called from every page
    # load) vs PROTECTED read endpoint (admin only). This fixes the v1
    # contradiction where the public tracker also required an API key.
    # ------------------------------------------------------------------
    @app.route('/api/track', methods=['POST'])
    @limiter.limit('120 per hour')
    def track_event():
        from models import AnalyticsEvent
        data = request.get_json(silent=True) or {}
        event = AnalyticsEvent(
            event_type=(data.get('event_type') or 'page_view')[:100],
            page=(data.get('page') or '')[:255],
            ip_address=request.headers.get('X-Forwarded-For', request.remote_addr),
            user_agent=request.headers.get('User-Agent', '')[:500],
            meta=data.get('meta') or {},
        )
        db.session.add(event)
        db.session.commit()
        return jsonify({'success': True}), 201

    # ------------------------------------------------------------------
    # Admin login — validates password and returns the key
    # ------------------------------------------------------------------
    @app.route('/api/admin/login', methods=['POST'])
    @limiter.limit('10 per hour')
    def admin_login():
        data = request.get_json(silent=True) or {}
        password = (data.get('password') or '').strip()
        if not password:
            return jsonify({'error': 'Password is required'}), 400
        if password == app.config['ADMIN_API_KEY']:
            return jsonify({'success': True, 'key': app.config['ADMIN_API_KEY']})
        return jsonify({'error': 'Invalid credentials'}), 401

    @app.route('/api/admin/logout', methods=['POST'])
    def admin_logout():
        return jsonify({'success': True})

    # ------------------------------------------------------------------
    # Admin endpoints — require X-API-Key header
    # ------------------------------------------------------------------
    def require_api_key(view):
        from functools import wraps

        @wraps(view)
        def wrapped(*args, **kwargs):
            key = request.headers.get('X-API-Key')
            if not key or key != app.config['ADMIN_API_KEY']:
                return jsonify({'error': 'Unauthorized'}), 401
            return view(*args, **kwargs)
        return wrapped

    @app.route('/api/admin/contacts')
    @require_api_key
    def admin_contacts():
        try:
            from models import Contact
            contacts = Contact.query.order_by(Contact.created_at.desc()).limit(200).all()
            return jsonify([c.to_dict() for c in contacts])
        except Exception:
            return jsonify([])

    @app.route('/api/admin/contacts/<int:cid>', methods=['DELETE'])
    @require_api_key
    def admin_delete_contact(cid):
        from models import Contact
        c = Contact.query.get_or_404(cid)
        db.session.delete(c)
        db.session.commit()
        return jsonify({'success': True})

    @app.route('/api/admin/contacts/bulk-delete', methods=['POST'])
    @require_api_key
    def admin_bulk_delete_contacts():
        from models import Contact
        data = request.get_json(silent=True) or {}
        ids = data.get('ids', [])
        if not ids:
            return jsonify({'error': 'No ids provided'}), 400
        Contact.query.filter(Contact.id.in_(ids)).delete(synchronize_session=False)
        db.session.commit()
        return jsonify({'success': True})

    # ── Projects CRUD ──────────────────────────────────────
    @app.route('/api/admin/projects', methods=['POST'])
    @require_api_key
    def admin_create_project():
        from models import Project
        data = request.get_json(silent=True) or {}
        if not data.get('title'):
            return jsonify({'error': 'title is required'}), 400
        p = Project(
            title=data['title'][:255],
            description=data.get('description', ''),
            category=data.get('category', ''),
            technologies=data.get('technologies', []),
            impact=data.get('impact', ''),
            status=data.get('status', 'completed'),
            github_url=data.get('github_url') or None,
            demo_url=data.get('demo_url') or None,
            display_order=int(data.get('display_order', 0)),
            featured=bool(data.get('featured', True)),
            image_url=data.get('image_url') or None,
        )
        db.session.add(p)
        db.session.commit()
        return jsonify(p.to_dict()), 201

    @app.route('/api/admin/projects/<int:pid>', methods=['PUT'])
    @require_api_key
    def admin_update_project(pid):
        from models import Project
        p = Project.query.get_or_404(pid)
        data = request.get_json(silent=True) or {}
        if 'title' in data: p.title = data['title'][:255]
        if 'description' in data: p.description = data['description']
        if 'category' in data: p.category = data['category']
        if 'technologies' in data: p.technologies = data['technologies']
        if 'impact' in data: p.impact = data['impact']
        if 'status' in data: p.status = data['status']
        if 'github_url' in data: p.github_url = data['github_url'] or None
        if 'demo_url' in data: p.demo_url = data['demo_url'] or None
        if 'display_order' in data: p.display_order = int(data['display_order'])
        if 'featured' in data: p.featured = bool(data['featured'])
        if 'image_url' in data: p.image_url = data['image_url'] or None
        db.session.commit()
        return jsonify(p.to_dict())

    @app.route('/api/admin/projects/<int:pid>', methods=['DELETE'])
    @require_api_key
    def admin_delete_project(pid):
        from models import Project
        p = Project.query.get_or_404(pid)
        db.session.delete(p)
        db.session.commit()
        return jsonify({'success': True})

    @app.route('/api/admin/projects/<int:pid>/image', methods=['POST'])
    @require_api_key
    def admin_project_image(pid):
        from models import Project
        p = Project.query.get_or_404(pid)
        ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
        if 'image' not in request.files:
            return jsonify({'error': 'image file is required'}), 400
        f = request.files['image']
        if f.filename == '':
            return jsonify({'error': 'empty filename'}), 400
        ext = (f.filename.rsplit('.', 1)[-1] if '.' in f.filename else '').lower()
        if ext not in ALLOWED_EXTENSIONS:
            allowed_str = ', '.join(sorted(ALLOWED_EXTENSIONS))
            return jsonify({'error': 'Invalid file type. Allowed: ' + allowed_str}), 400
        save_dir = os.path.join(app.static_folder, 'images', 'projects')
        os.makedirs(save_dir, exist_ok=True)
        dest = os.path.join(save_dir, f'{p.id}.jpg')
        try:
            f.save(dest)
            p.image_url = f'/images/projects/{p.id}.jpg'
            db.session.commit()
            return jsonify({'ok': True, 'url': p.image_url})
        except Exception as e:
            logger.exception('Failed to save project image')
            return jsonify({'error': 'failed to save image'}), 500

    # ── Skills CRUD ────────────────────────────────────────
    @app.route('/api/admin/skills', methods=['POST'])
    @require_api_key
    def admin_create_skill():
        from models import Skill
        data = request.get_json(silent=True) or {}
        if not data.get('name'):
            return jsonify({'error': 'name is required'}), 400
        s = Skill(
            name=data['name'][:100],
            category=data.get('category', 'Other')[:100],
            level=data.get('level', 'Intermediate'),
            proficiency=max(0, min(100, int(data.get('proficiency', 80)))),
            icon=data.get('icon', '⚡')[:10],
            display_order=int(data.get('display_order', 0)),
        )
        db.session.add(s)
        db.session.commit()
        return jsonify(s.to_dict()), 201

    @app.route('/api/admin/skills/<int:sid>', methods=['PUT'])
    @require_api_key
    def admin_update_skill(sid):
        from models import Skill
        s = Skill.query.get_or_404(sid)
        data = request.get_json(silent=True) or {}
        if 'name' in data: s.name = data['name'][:100]
        if 'category' in data: s.category = data['category'][:100]
        if 'level' in data: s.level = data['level']
        if 'proficiency' in data: s.proficiency = max(0, min(100, int(data['proficiency'])))
        if 'icon' in data: s.icon = data['icon'][:10]
        if 'display_order' in data: s.display_order = int(data['display_order'])
        db.session.commit()
        return jsonify(s.to_dict())

    @app.route('/api/admin/skills/<int:sid>', methods=['DELETE'])
    @require_api_key
    def admin_delete_skill(sid):
        from models import Skill
        s = Skill.query.get_or_404(sid)
        db.session.delete(s)
        db.session.commit()
        return jsonify({'success': True})

    # ── Education CRUD ─────────────────────────────────────
    @app.route('/api/admin/education', methods=['POST'])
    @require_api_key
    def admin_create_education():
        from models import Education
        data = request.get_json(silent=True) or {}
        if not data.get('degree'):
            return jsonify({'error': 'degree is required'}), 400
        e = Education(
            degree=data['degree'][:255],
            institution=data.get('institution', '')[:255],
            year_range=data.get('year_range', ''),
            description=data.get('description', ''),
            display_order=int(data.get('display_order', 0)),
        )
        db.session.add(e)
        db.session.commit()
        return jsonify(e.to_dict()), 201

    @app.route('/api/admin/education/<int:eid>', methods=['PUT'])
    @require_api_key
    def admin_update_education(eid):
        from models import Education
        e = Education.query.get_or_404(eid)
        data = request.get_json(silent=True) or {}
        if 'degree' in data: e.degree = data['degree'][:255]
        if 'institution' in data: e.institution = data['institution'][:255]
        if 'year_range' in data: e.year_range = data['year_range']
        if 'description' in data: e.description = data['description']
        if 'display_order' in data: e.display_order = int(data['display_order'])
        db.session.commit()
        return jsonify(e.to_dict())

    @app.route('/api/admin/education/<int:eid>', methods=['DELETE'])
    @require_api_key
    def admin_delete_education(eid):
        from models import Education
        e = Education.query.get_or_404(eid)
        db.session.delete(e)
        db.session.commit()
        return jsonify({'success': True})

    # ── Certifications CRUD ────────────────────────────────
    @app.route('/api/admin/certifications', methods=['POST'])
    @require_api_key
    def admin_create_certification():
        from models import Certification
        data = request.get_json(silent=True) or {}
        if not data.get('title'):
            return jsonify({'error': 'title is required'}), 400
        c = Certification(
            title=data['title'][:255],
            issuer=data.get('issuer', '')[:255],
            year=data.get('year', ''),
            credential_url=data.get('credential_url') or None,
            display_order=int(data.get('display_order', 0)),
        )
        db.session.add(c)
        db.session.commit()
        return jsonify(c.to_dict()), 201

    @app.route('/api/admin/certifications/<int:cid>', methods=['PUT'])
    @require_api_key
    def admin_update_certification(cid):
        from models import Certification
        c = Certification.query.get_or_404(cid)
        data = request.get_json(silent=True) or {}
        if 'title' in data: c.title = data['title'][:255]
        if 'issuer' in data: c.issuer = data['issuer'][:255]
        if 'year' in data: c.year = data['year']
        if 'credential_url' in data: c.credential_url = data['credential_url'] or None
        if 'display_order' in data: c.display_order = int(data['display_order'])
        db.session.commit()
        return jsonify(c.to_dict())

    @app.route('/api/admin/certifications/<int:cid>', methods=['DELETE'])
    @require_api_key
    def admin_delete_certification(cid):
        from models import Certification
        c = Certification.query.get_or_404(cid)
        db.session.delete(c)
        db.session.commit()
        return jsonify({'success': True})

    # ── Testimonials CRUD ──────────────────────────────────
    @app.route('/api/admin/testimonials', methods=['POST'])
    @require_api_key
    def admin_create_testimonial():
        from models import Testimonial
        data = request.get_json(silent=True) or {}
        if not data.get('author_name') or not data.get('quote'):
            return jsonify({'error': 'author_name and quote are required'}), 400
        t = Testimonial(
            quote=data['quote'],
            author_name=data['author_name'][:255],
            author_title=data.get('author_title', '')[:255],
            avatar_initial=data.get('avatar_initial', '?')[:4],
            approved=bool(data.get('approved', True)),
            display_order=int(data.get('display_order', 0)),
        )
        db.session.add(t)
        db.session.commit()
        return jsonify(t.to_dict()), 201

    @app.route('/api/admin/testimonials/<int:tid>', methods=['PUT'])
    @require_api_key
    def admin_update_testimonial(tid):
        from models import Testimonial
        t = Testimonial.query.get_or_404(tid)
        data = request.get_json(silent=True) or {}
        if 'quote' in data: t.quote = data['quote']
        if 'author_name' in data: t.author_name = data['author_name'][:255]
        if 'author_title' in data: t.author_title = data['author_title'][:255]
        if 'avatar_initial' in data: t.avatar_initial = data['avatar_initial'][:4]
        if 'approved' in data: t.approved = bool(data['approved'])
        if 'display_order' in data: t.display_order = int(data['display_order'])
        db.session.commit()
        return jsonify(t.to_dict())

    @app.route('/api/admin/testimonials/<int:tid>', methods=['DELETE'])
    @require_api_key
    def admin_delete_testimonial(tid):
        from models import Testimonial
        t = Testimonial.query.get_or_404(tid)
        db.session.delete(t)
        db.session.commit()
        return jsonify({'success': True})


    # ── Public read: Experience, Blog, Profile ─────────────
    @app.route('/api/experience')
    def get_experience():
        try:
            from models import Experience
            items = Experience.query.order_by(Experience.display_order, Experience.id).all()
            return jsonify([e.to_dict() for e in items])
        except Exception:
            return jsonify([])

    @app.route('/api/blog')
    def get_blog():
        try:
            from models import BlogPost
            posts = BlogPost.query.filter_by(published=True).order_by(BlogPost.display_order, BlogPost.id).all()
            return jsonify([p.to_dict() for p in posts])
        except Exception:
            return jsonify([])

    @app.route('/api/blog/<slug>')
    def get_blog_post(slug):
        from models import BlogPost
        post = BlogPost.query.filter_by(slug=slug, published=True).first_or_404()
        return jsonify(post.to_dict(include_content=True))

    @app.route('/api/profile')
    def get_profile():
        try:
            from models import SiteProfile
            profile = SiteProfile.query.first()
            if not profile:
                profile = SiteProfile()
                db.session.add(profile)
                db.session.commit()
            return jsonify(profile.to_dict())
        except Exception:
            logger.warning('DB unreachable for /api/profile, returning fallback')
            return jsonify(FALLBACK_PROFILE)

    # ── Experience CRUD ────────────────────────────────────
    @app.route('/api/admin/experience', methods=['POST'])
    @require_api_key
    def admin_create_experience():
        from models import Experience
        data = request.get_json(silent=True) or {}
        if not data.get('role') or not data.get('company'):
            return jsonify({'error': 'role and company are required'}), 400
        e = Experience(
            role=data['role'][:255],
            company=data['company'][:255],
            location=data.get('location', '')[:255],
            start_date=data.get('start_date', '')[:20],
            end_date=data.get('end_date', 'Present')[:20],
            description=data.get('description', ''),
            technologies=data.get('technologies', []),
            display_order=int(data.get('display_order', 0)),
        )
        db.session.add(e)
        db.session.commit()
        return jsonify(e.to_dict()), 201

    @app.route('/api/admin/experience/<int:eid>', methods=['PUT'])
    @require_api_key
    def admin_update_experience(eid):
        from models import Experience
        e = Experience.query.get_or_404(eid)
        data = request.get_json(silent=True) or {}
        if 'role' in data: e.role = data['role'][:255]
        if 'company' in data: e.company = data['company'][:255]
        if 'location' in data: e.location = data['location'][:255]
        if 'start_date' in data: e.start_date = data['start_date'][:20]
        if 'end_date' in data: e.end_date = data['end_date'][:20]
        if 'description' in data: e.description = data['description']
        if 'technologies' in data: e.technologies = data['technologies']
        if 'display_order' in data: e.display_order = int(data['display_order'])
        db.session.commit()
        return jsonify(e.to_dict())

    @app.route('/api/admin/experience/<int:eid>', methods=['DELETE'])
    @require_api_key
    def admin_delete_experience(eid):
        from models import Experience
        e = Experience.query.get_or_404(eid)
        db.session.delete(e)
        db.session.commit()
        return jsonify({'success': True})

    # ── Blog CRUD ──────────────────────────────────────────
    @app.route('/api/admin/blog', methods=['GET'])
    @require_api_key
    def admin_list_blog():
        from models import BlogPost
        posts = BlogPost.query.order_by(BlogPost.display_order, BlogPost.id).all()
        return jsonify([p.to_dict(include_content=True) for p in posts])

    @app.route('/api/admin/blog', methods=['POST'])
    @require_api_key
    def admin_create_blog():
        import re
        from models import BlogPost
        data = request.get_json(silent=True) or {}
        if not data.get('title'):
            return jsonify({'error': 'title is required'}), 400
        # auto-generate slug
        raw = data.get('slug') or data['title']
        slug = re.sub(r'[^a-z0-9]+', '-', raw.lower()).strip('-')[:200]
        # ensure uniqueness
        base, suffix = slug, 1
        while BlogPost.query.filter_by(slug=slug).first():
            slug = f'{base}-{suffix}'; suffix += 1
        p = BlogPost(
            title=data['title'][:255],
            slug=slug,
            summary=data.get('summary', '')[:500],
            content=data.get('content', ''),
            tags=data.get('tags', []),
            published=bool(data.get('published', False)),
            display_order=int(data.get('display_order', 0)),
        )
        db.session.add(p)
        db.session.commit()
        return jsonify(p.to_dict(include_content=True)), 201

    @app.route('/api/admin/blog/<int:bid>', methods=['PUT'])
    @require_api_key
    def admin_update_blog(bid):
        from models import BlogPost
        p = BlogPost.query.get_or_404(bid)
        data = request.get_json(silent=True) or {}
        if 'title' in data: p.title = data['title'][:255]
        if 'summary' in data: p.summary = data['summary'][:500]
        if 'content' in data: p.content = data['content']
        if 'tags' in data: p.tags = data['tags']
        if 'published' in data: p.published = bool(data['published'])
        if 'display_order' in data: p.display_order = int(data['display_order'])
        db.session.commit()
        return jsonify(p.to_dict(include_content=True))

    @app.route('/api/admin/blog/<int:bid>', methods=['DELETE'])
    @require_api_key
    def admin_delete_blog(bid):
        from models import BlogPost
        p = BlogPost.query.get_or_404(bid)
        db.session.delete(p)
        db.session.commit()
        return jsonify({'success': True})

    # ── Profile CRUD ───────────────────────────────────────
    @app.route('/api/admin/profile', methods=['POST'])
    @require_api_key
    def admin_update_profile():
        from models import SiteProfile
        data = request.get_json(silent=True) or {}
        profile = SiteProfile.query.first()
        if not profile:
            profile = SiteProfile()
            db.session.add(profile)
        fields = ['full_name','job_title','tagline','bio','location','email',
                  'phone','github_url','linkedin_url','twitter_url','website_url',
                  'telegram_url','whatsapp_url','instagram_url','facebook_url','kaggle_url',
                  'leetcode_url', 'availability_status']
        for f in fields:
            if f in data:
                setattr(profile, f, data[f] or '')
        db.session.commit()
        return jsonify(profile.to_dict())

    # ── Resume upload ──────────────────────────────────────
    @app.route('/api/admin/resume', methods=['POST'])
    @require_api_key
    def admin_upload_resume():
        if 'resume' not in request.files:
            return jsonify({'error': 'resume file is required'}), 400
        f = request.files['resume']
        if f.filename == '':
            return jsonify({'error': 'empty filename'}), 400
        ext = (f.filename.rsplit('.', 1)[-1] if '.' in f.filename else '').lower()
        if ext != 'pdf':
            return jsonify({'error': 'Only PDF files are accepted'}), 400
        dest = os.path.join(app.static_folder, 'resume.pdf')
        try:
            f.save(dest)
            return jsonify({'ok': True, 'url': '/api/resume'})
        except Exception:
            logger.exception('Failed to save resume')
            return jsonify({'error': 'Failed to save resume'}), 500

    # ------------------------- Site settings & owner image -----------------
    SETTINGS_PATH = os.path.join(os.path.dirname(__file__), 'settings.json')

    def _read_settings():
        defaults = {
            'show_about': True,
            'show_projects': True,
            'show_skills': True,
            'show_experience': True,
            'show_education': True,
            'show_certifications': True,
            'show_testimonials': True,
            'show_contact': True,
            'show_header': True,
            'show_footer': True,
            'owner_image': '/images/owner.jpg',
            'flashcard_label': 'Portfolio ID',
            'flashcard_show_email': True,
            'flashcard_show_phone': True,
            'theme_palette': 'neon',
            'show_telegram': True,
            'show_whatsapp': True,
            'show_instagram': True,
            'show_facebook': True,
            'show_kaggle': True,
            'show_email': True,
            'show_phone': True,
            'show_github': True,
            'show_leetcode': True,
            'show_linkedin': True,
            'theme_mode': 'dark',
            'theme_accent': '#ffa500',
            'theme_accent_dark': '#ff8c00',
            'theme_background': '#0b0e14',
            'theme_surface': '#111827',
            'theme_text': '#e7e9ee',
            'theme_text_muted': '#98a0b3',
            'theme_font': "'Inter', system-ui, sans-serif",
            # Hero background
            'hero_bg_image': '',
            'hero_bg_video': '',
            'hero_bg_opacity': 0.18,
            'hero_bg_parallax': True,
            'hero_bg_blur': 0,
            # Animation effects
            'enable_magnetic_cursor': True,
            'enable_particle_trail': True,
            'enable_gradient_orbs': True,
            'enable_card_tilt': True,
            # Footer
            'footer_tagline': 'Built with Flask, Python & a lot of coffee.',
            'footer_show_social': True,
        }
        try:
            if os.path.exists(SETTINGS_PATH):
                with open(SETTINGS_PATH, 'r', encoding='utf-8') as fh:
                    data = json.load(fh)
                    defaults.update(data or {})
        except Exception:
            logger.exception('Could not read settings file')
        return defaults

    def _write_settings(data: dict):
        try:
            with open(SETTINGS_PATH, 'w', encoding='utf-8') as fh:
                json.dump(data, fh, indent=2)
            return True
        except Exception:
            logger.exception('Could not write settings file')
            return False

    @app.route('/api/site/settings')
    def site_settings():
        return jsonify(_read_settings())

    @app.route('/api/admin/site/settings', methods=['POST'])
    @require_api_key
    def admin_site_settings():
        data = request.get_json(silent=True) or {}
        settings = _read_settings()
        # update only known keys
        for k in settings.keys():
            if k in data:
                settings[k] = data[k]
        ok = _write_settings(settings)
        return jsonify({'ok': ok, 'settings': settings})

    @app.route('/api/admin/owner-image', methods=['POST'])
    @require_api_key
    def admin_owner_image():
        ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
        if 'image' not in request.files:
            return jsonify({'error': 'image file is required'}), 400
        f = request.files['image']
        if f.filename == '':
            return jsonify({'error': 'empty filename'}), 400
        ext = (f.filename.rsplit('.', 1)[-1] if '.' in f.filename else '').lower()
        if ext not in ALLOWED_EXTENSIONS:
            allowed_str = ', '.join(sorted(ALLOWED_EXTENSIONS))
            return jsonify({'error': 'Invalid file type. Allowed: ' + allowed_str}), 400
        save_dir = os.path.join(app.static_folder, 'images')
        os.makedirs(save_dir, exist_ok=True)
        dest = os.path.join(save_dir, 'owner.jpg')
        try:
            f.save(dest)
            settings = _read_settings()
            settings['owner_image'] = '/images/owner.jpg'
            _write_settings(settings)
            return jsonify({'ok': True, 'url': settings['owner_image']})
        except Exception as e:
            logger.exception('Failed to save owner image')
            return jsonify({'error': 'failed to save image'}), 500

    @app.route('/api/admin/hero-bg-image', methods=['POST'])
    @require_api_key
    def admin_hero_bg_image():
        """Upload a hero background image (stored as hero-bg.jpg in /images/)."""
        ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
        if 'image' not in request.files:
            return jsonify({'error': 'image file is required'}), 400
        f = request.files['image']
        if f.filename == '':
            return jsonify({'error': 'empty filename'}), 400
        ext = (f.filename.rsplit('.', 1)[-1] if '.' in f.filename else '').lower()
        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({'error': 'Invalid file type. Allowed: jpg, jpeg, png, webp'}), 400
        save_dir = os.path.join(app.static_folder, 'images')
        os.makedirs(save_dir, exist_ok=True)
        filename = f'hero-bg.{ext}'
        dest = os.path.join(save_dir, filename)
        try:
            f.save(dest)
            url = f'/images/{filename}'
            settings = _read_settings()
            settings['hero_bg_image'] = url
            _write_settings(settings)
            return jsonify({'ok': True, 'url': url})
        except Exception:
            logger.exception('Failed to save hero bg image')
            return jsonify({'error': 'Failed to save image'}), 500


    # Admin: list contacts and manage AI commands (no review queue)
    @app.route('/api/admin/analytics/summary')
    @require_api_key
    def admin_analytics_summary():
        from models import AnalyticsEvent
        since = datetime.now(timezone.utc) - timedelta(days=30)
        total = AnalyticsEvent.query.filter(AnalyticsEvent.timestamp >= since).count()
        by_type = (db.session.query(AnalyticsEvent.event_type, db.func.count(AnalyticsEvent.id))
                   .filter(AnalyticsEvent.timestamp >= since)
                   .group_by(AnalyticsEvent.event_type).all())
        return jsonify({
            'total_events_30d': total,
            'by_type': {t: c for t, c in by_type},
        })

    # ------------------------------------------------------------------
    # Error handlers
    # ------------------------------------------------------------------
    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith('/api/'):
            return jsonify({'error': 'Endpoint not found'}), 404
        index_path = os.path.join(app.static_folder, 'index.html')
        if os.path.isfile(index_path):
            return send_from_directory(app.static_folder, 'index.html')
        return jsonify({'error': 'Frontend not built yet: backend/static/index.html is missing.'}), 404

    @app.errorhandler(429)
    def ratelimited(e):
        return jsonify({'error': 'Too many requests — please slow down.'}), 429

    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Internal server error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

    return app


def _is_valid_email(email: str) -> bool:
    import re
    return bool(re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email))


# Create the app instance
app = create_app()

# Background AI command scheduler is disabled in this deployment.

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=app.config.get('DEBUG', False))
