from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import auth, cameras, health, media, users
from app.core.database import migrate
from app.core.errors import install_error_handlers
from app.services.media import media as media_manager


@asynccontextmanager
async def lifespan(_: FastAPI):
    migrate()
    yield
    media_manager.shutdown()


app = FastAPI(title='Tapo Home Monitor', version='0.1.0', lifespan=lifespan)
install_error_handlers(app)
for router in (health.router, auth.router, users.router, cameras.router, media.router):
    app.include_router(router)
