def register_justincase_routes(app):
    """
    Регистрирует маршруты JustInCase в приложении Flask
    """
    try:
        app.register_blueprint(justincase_bp, url_prefix="/api")
        logger.info("✅ JustInCase маршруты зарегистрированы")
        return True
    except Exception as e:
        logger.error(f"❌ Ошибка регистрации JustInCase маршрутов: {e}")
        return False
