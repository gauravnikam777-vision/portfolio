"""
Seed the database with real portfolio content (Gaurav Nikam's resume data).
Idempotent: safe to run multiple times — it clears and re-inserts rather
than duplicating rows, so it can run on every container start.

Usage:
    python seed_db.py
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import logging
from app import create_app
from extensions import db
from models import Project, Skill, Education, Certification, Testimonial

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECTS = [
    dict(
        title='SuperStore Sales Dashboard & Forecasting',
        category='Dashboards',
        description=('Interactive Power BI dashboard analyzing sales, profit, and quantity KPIs '
                      'across 4 business regions using DAX measures and drill-down visualizations. '
                      'EDA in Python uncovered negative margins in the Tables category and strong '
                      'Q4 seasonality. Built a 20-day sales forecast with a 95% confidence interval '
                      'to support inventory planning.'),
        technologies=['Power BI', 'Python', 'DAX', 'Pandas'],
        impact='95% CI Forecast',
        display_order=1,
    ),
    dict(
        title='Customer Churn Prediction Dashboard',
        category='Machine Learning',
        description=('End-to-end churn prediction system on 7,043 customers and 20 business '
                      'features using Logistic Regression. Identified 1,769 high-risk customers '
                      '(25.1%) and key churn drivers including contract type, tenure, and monthly '
                      'charges, surfaced through an interactive risk-segmentation dashboard.'),
        technologies=['Python', 'SQL', 'Scikit-Learn', 'Logistic Regression'],
        impact='25.1% Churn Identified',
        display_order=2,
    ),
    dict(
        title='Trader Behavior Insights Analysis',
        category='Data Analysis',
        description=('Analyzed trader behavior data to identify performance trends under different '
                      'market conditions. Applied statistical analysis and visualization to uncover '
                      'profitability patterns and generated reports supporting strategy evaluation.'),
        technologies=['Python', 'Pandas', 'Matplotlib', 'Statistics'],
        impact='Strategy Evaluation',
        display_order=3,
    ),
    dict(
        title='Diabetes Risk Predictor (Live Web App)',
        category='Machine Learning',
        description=('Deployed ML web application using XGBoost on 100,000 patient records and 8 '
                      'predictive features. Built a complete pipeline including preprocessing, '
                      'feature scaling, class-imbalance handling, and real-time risk prediction via '
                      'an interactive Streamlit app.'),
        technologies=['Python', 'XGBoost', 'Streamlit', 'Feature Engineering'],
        impact='100K Patient Records',
        display_order=4,
    ),
]

SKILLS = [
    # category, name, level, proficiency, icon
    ('Programming & Database', 'Python', 'Expert', 95, '🐍'),
    ('Programming & Database', 'SQL', 'Expert', 95, '🗄️'),
    ('Programming & Database', 'MySQL', 'Advanced', 85, '🛢️'),
    ('Business Intelligence', 'Power BI', 'Expert', 95, '📊'),
    ('Business Intelligence', 'Tableau', 'Advanced', 85, '📈'),
    ('Business Intelligence', 'Advanced Excel', 'Expert', 90, '📑'),
    ('Data Science & ML', 'Pandas', 'Expert', 95, '🐼'),
    ('Data Science & ML', 'NumPy', 'Advanced', 85, '🔢'),
    ('Data Science & ML', 'Scikit-Learn', 'Advanced', 85, '🤖'),
    ('Data Science & ML', 'XGBoost', 'Advanced', 80, '⚡'),
    ('Data Science & ML', 'Matplotlib / Seaborn', 'Advanced', 85, '📉'),
    ('Tools & Workflow', 'Git & GitHub', 'Advanced', 85, '🔧'),
    ('Tools & Workflow', 'Jupyter / Colab', 'Expert', 90, '📓'),
    ('Tools & Workflow', 'Streamlit', 'Advanced', 80, '🚀'),
]

EDUCATION = [
    dict(degree='Master of Computer Applications (MCA)',
         institution='Sinhgad Institute of Management, Pune',
         year_range='2024 – 2026',
         description='Advanced studies in computer science, databases, and data analytics.',
         display_order=1),
    dict(degree='Bachelor of Business Administration – Computer Applications (BBA-CA)',
         institution='Savitribai Phule Pune University',
         year_range='2021 – 2024',
         description='Foundations in business applications and computer science.',
         display_order=2),
]

CERTIFICATIONS = [
    dict(title='Artificial Intelligence: Concepts and Techniques', issuer='NPTEL', year='2025', display_order=1),
    dict(title='Python for Data Science', issuer='IBM', year='2025', display_order=2),
    dict(title='Machine Learning Statistical Foundations', issuer='Wolfram Research', year='2025', display_order=3),
    dict(title='Advanced Excel', issuer='ExcelR', year='2022', display_order=4),
]

TESTIMONIALS = [
    dict(
        quote=('Gaurav has a sharp eye for turning messy data into a clear business story. '
               'His SuperStore dashboard surfaced margin issues we had completely missed.'),
        author_name='Faculty Mentor', author_title='Sinhgad Institute of Management',
        avatar_initial='FM', display_order=1,
    ),
    dict(
        quote=('Working with Gaurav on the churn project, his structured approach to feature '
               'analysis and clear dashboarding made the risk segmentation immediately actionable.'),
        author_name='Project Collaborator', author_title='Data Analytics Cohort',
        avatar_initial='PC', display_order=2,
    ),
    dict(
        quote=('What stands out about Gaurav is how he pairs solid statistical thinking with '
               'genuinely usable dashboards — not just charts, but decisions people can act on.'),
        author_name='Peer Reviewer', author_title='MCA Program',
        avatar_initial='PR', display_order=3,
    ),
]


def seed():
    app = create_app()
    with app.app_context():
        db.create_all()

        Project.query.delete()
        Skill.query.delete()
        Education.query.delete()
        Certification.query.delete()
        Testimonial.query.delete()

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

        db.session.commit()
        logger.info(f"Seeded {len(PROJECTS)} projects, {len(SKILLS)} skills, "
                    f"{len(EDUCATION)} education entries, {len(CERTIFICATIONS)} certifications, "
                    f"{len(TESTIMONIALS)} testimonials.")


if __name__ == '__main__':
    seed()
