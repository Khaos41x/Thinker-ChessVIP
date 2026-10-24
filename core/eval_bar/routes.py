from flask import Blueprint, jsonify, request
from .registry import ENGINE_IDS
from .stockfish_service import StockfishEvalBarError


def create_engine_registry_blueprint(registry, control_auth):
    routes = Blueprint('analysis_engines', __name__)

    def select():
        data = request.get_json(silent=True)
        if not isinstance(data, dict) or data.get('engineId') not in ENGINE_IDS:
            return jsonify({'error': 'Unknown analysis engine'}), 400
        try:
            return jsonify({'ok': True, **registry.select(data['engineId'], initialize_only=data.get('initializeOnly') is True)})
        except StockfishEvalBarError as error:
            return jsonify({'ok': False, 'error': str(error), **registry.snapshot()}), 503

    @routes.get('/eval-bar/engines')
    @control_auth
    def engines():
        if "context" in request.args:
            registry.authorize_context(request.args.get("context"))
        return jsonify(registry.snapshot())

    @routes.post('/eval-bar/engines/select')
    @control_auth
    def select_engine():
        data = request.get_json(silent=True)
        if not isinstance(data, dict) or data.get('context') not in {'analysis', 'post-game'}:
            return jsonify({'error': 'An authorized analysis context is required'}), 403
        return select()

    @routes.post('/eval-bar/engines/preference')
    @control_auth
    def engine_preference():
        return local_select_engine()

    @routes.before_request
    def protect_local_config():
        if request.path.startswith('/config/engines'):
            origin = request.headers.get('Origin')
            if origin and origin.rstrip('/') != request.host_url.rstrip('/'):
                return jsonify({'error': 'Same-origin configuration access required'}), 403
            if request.headers.get('Sec-Fetch-Site') in {'cross-site', 'same-site'}:
                return jsonify({'error': 'Same-origin configuration access required'}), 403
            if request.remote_addr not in {'127.0.0.1', '::1'}:
                return jsonify({'error': 'Local configuration access required'}), 403

    @routes.get('/config/engines')
    def local_engines():
        return jsonify(registry.snapshot())

    @routes.post('/config/engines/select')
    def local_select_engine():
        data = request.get_json(silent=True)
        if not isinstance(data, dict) or data.get('engineId') not in ENGINE_IDS:
            return jsonify({'error': 'Unknown analysis engine'}), 400
        try:
            return jsonify({'ok': True, **registry.prefer(data['engineId'], data.get('expectedRevision'))})
        except ValueError as error:
            return jsonify({'ok': False, 'error': str(error), **registry.snapshot()}), 409
        except (StockfishEvalBarError, OSError) as error:
            return jsonify({'ok': False, 'error': str(error), **registry.snapshot()}), 503

    return routes
