"""
Smoke tests for the API. Run with: pytest -v
These directly address a v1 gap: pytest was listed as a dependency but
no test files existed at all.
"""


def test_health(client):
    resp = client.get('/api/health')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['status'] in ('ok', 'degraded')
    assert 'features' in data


def test_projects_empty_list_is_safe(client):
    """Before seeding, this must return [] not crash."""
    resp = client.get('/api/projects')
    assert resp.status_code == 200
    assert isinstance(resp.get_json(), list)


def test_contact_requires_fields(client):
    resp = client.post('/api/contact', json={})
    assert resp.status_code == 400


def test_contact_rejects_bad_email(client):
    resp = client.post('/api/contact', json={
        'name': 'Test User', 'email': 'not-an-email', 'message': 'Hello there'
    })
    assert resp.status_code == 400


def test_contact_success(client):
    resp = client.post('/api/contact', json={
        'name': 'Test User', 'email': 'test@example.com', 'message': 'Hello, this is a test message.'
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['success'] is True


def test_contact_strips_html(client):
    resp = client.post('/api/contact', json={
        'name': '<script>alert(1)</script>Bob',
        'email': 'bob@example.com',
        'message': 'hi'
    })
    assert resp.status_code == 201


def test_admin_endpoint_requires_api_key(client):
    resp = client.get('/api/admin/contacts')
    assert resp.status_code == 401


def test_admin_page_is_available(client):
    resp = client.get('/admin')
    assert resp.status_code == 200
    assert b'Portfolio Admin' in resp.data


def test_track_event_is_public_no_auth_required(client):
    """This was contradictory in v1 — public tracker required an API key."""
    resp = client.post('/api/track', json={'event_type': 'page_view', 'page': '/'})
    assert resp.status_code == 201


def test_unknown_api_route_returns_json_404(client):
    resp = client.get('/api/this-does-not-exist')
    assert resp.status_code == 404
    assert resp.get_json() is not None


def test_admin_update_settings(client):
    key = client.application.config['ADMIN_API_KEY']
    headers = {'X-API-Key': key}
    payload = {
        'theme_mode': 'light',
        'theme_accent': '#ff0000',
    }
    resp = client.post('/api/admin/site/settings', json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['ok'] is True
    assert data['settings']['theme_mode'] == 'light'
    assert data['settings']['theme_accent'] == '#ff0000'

    # Verify that GET returns the updated settings
    resp2 = client.get('/api/site/settings')
    assert resp2.status_code == 200
    data2 = resp2.get_json()
    assert data2['theme_mode'] == 'light'
    assert data2['theme_accent'] == '#ff0000'

